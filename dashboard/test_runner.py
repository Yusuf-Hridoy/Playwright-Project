"""
Playwright test runner for the Test Command Center.

Runs `npx playwright test` as an asynchronous subprocess, streams stdout/stderr
line-by-line, persists a log file, parses the Playwright JSON report, and
updates the database record when finished.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, Run
from test_discovery import discover_tests

logger = logging.getLogger(__name__)

# Resolve absolute paths relative to this file (dashboard/test_runner.py).
DASHBOARD_DIR = Path(__file__).resolve().parent
REPO_ROOT = DASHBOARD_DIR.parent
TESTS_DIR = REPO_ROOT / "tests"
REPORTS_DIR = DASHBOARD_DIR / "reports"

# Playwright executable location. Prefer npx so the local node_modules copy is used.
# On Windows npx is a .cmd wrapper; create_subprocess_exec needs the full name.
PLAYWRIGHT_CMD = "npx.cmd" if sys.platform == "win32" else "npx"


class PlaywrightTestRunner:
    """Async runner that executes Playwright tests and yields live log lines."""

    # Tracks currently running subprocesses keyed by run_id.
    active_runs: dict[int, subprocess.Popen] = {}

    def __init__(
        self,
        run_id: int,
        folder: str,
        browsers: list[str],
        headed: bool,
    ) -> None:
        self.run_id = run_id
        self.folder = folder
        self.browsers = browsers or ["chromium"]
        self.headed = headed

        self.run_report_dir = REPORTS_DIR / str(run_id)
        self.log_file_path = self.run_report_dir / "run.log"
        self.report_json_path = self.run_report_dir / "report.json"

    def _build_command(self) -> tuple[list[str], Path]:
        """
        Build the Playwright CLI command and a temporary config file.

        The temporary config is placed in the repo root so that test path
        resolution matches the original playwright.config.js. It overrides
        the reporters so JSON and HTML outputs land in the run-specific
        report directory.
        """
        config_path = REPO_ROOT / f".dashboard-run-{self.run_id}.config.js"
        report_json_str = self.report_json_path.as_posix()
        report_html_str = self.run_report_dir.as_posix()

        config_content = f"""// Auto-generated run config for Playwright Test Command Center
import {{ defineConfig }} from '@playwright/test';
import original from './playwright.config.js';

export default defineConfig({{
  ...original,
  reporter: [
    ['html', {{ outputFolder: '{report_html_str}' }}],
    ['json', {{ outputFile: '{report_json_str}' }}],
  ],
}});
"""
        config_path.write_text(config_content, encoding="utf-8")

        cmd = [PLAYWRIGHT_CMD, "playwright", "test", f"--config={config_path.as_posix()}"]

        if self.folder == "uncategorized":
            # Run each .spec.js file directly under tests/ using relative paths
            # from the repo root (the temp config lives there).
            discovery = discover_tests(str(TESTS_DIR))
            files = discovery.get("flat", [])
            if not files:
                # Fallback to a glob relative to repo root.
                cmd.append("tests/*.spec.js")
            else:
                for file_path in files:
                    cmd.append(f"tests/{file_path}")
        else:
            # Run the selected folder relative to repo root.
            cmd.append(f"tests/{self.folder}")

        for browser in self.browsers:
            cmd.extend(["--project", browser])

        cmd.extend(["--output", str(self.run_report_dir)])

        if self.headed:
            cmd.append("--headed")

        return cmd, config_path

    async def _update_status(
        self,
        status: str,
        total_tests: int | None = None,
        passed: int | None = None,
        failed: int | None = None,
        skipped: int | None = None,
        duration_ms: int | None = None,
    ) -> None:
        """Persist status and optional stats to the runs table."""
        async with AsyncSessionLocal() as session:
            try:
                run = await session.get(Run, self.run_id)
                if run is None:
                    logger.error("Run id=%s not found in database", self.run_id)
                    return

                run.status = status
                if total_tests is not None:
                    run.total_tests = total_tests
                if passed is not None:
                    run.passed = passed
                if failed is not None:
                    run.failed = failed
                if skipped is not None:
                    run.skipped = skipped
                if duration_ms is not None:
                    run.duration_ms = duration_ms

                if status in ("completed", "failed", "error", "cancelled"):
                    run.completed_at = datetime.now(timezone.utc)
                    run.report_html_path = str(self.run_report_dir / "index.html")
                    run.report_json_path = str(self.run_report_dir / "report.json")

                await session.commit()
            except Exception as exc:
                await session.rollback()
                logger.exception("Failed to update run id=%s: %s", self.run_id, exc)

    def _parse_report(self) -> dict[str, Any]:
        """Parse the Playwright JSON report and return test stats."""
        if not self.report_json_path.exists():
            logger.warning("JSON report not found at %s", self.report_json_path)
            return {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "duration_ms": 0,
            }

        try:
            data = json.loads(self.report_json_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            logger.error("Failed to parse JSON report: %s", exc)
            return {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "duration_ms": 0,
            }

        stats = data.get("stats", {})

        # Playwright JSON reporter uses these stat keys.
        expected = stats.get("expected", 0)
        unexpected = stats.get("unexpected", 0)
        flaky = stats.get("flaky", 0)
        skipped = stats.get("skipped", 0)

        total = expected + unexpected + flaky + skipped
        passed = expected
        failed = unexpected + flaky

        duration = stats.get("duration", 0.0)
        try:
            duration_ms = int(duration)
        except (TypeError, ValueError):
            duration_ms = 0

        return {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "duration_ms": duration_ms,
        }

    def _stream_reader(
        self,
        stream,
        name: str,
        log_file,
        queue: asyncio.Queue,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        """Read a text stream line-by-line and feed an asyncio queue from a thread."""
        try:
            if stream is not None:
                for line in stream:
                    line = line.rstrip("\n")
                    if line:
                        log_file.write(line + "\n")
                        log_file.flush()
                        loop.call_soon_threadsafe(
                            queue.put_nowait, {"type": "log", "data": line}
                        )
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, {"__done__": name})

    async def run(self) -> AsyncGenerator[dict[str, Any], None]:
        """
        Execute Playwright tests and yield log lines as dicts.

        Yields:
            {"type": "log", "data": <line>, "timestamp": <iso>}
        """
        # Prepare report directory.
        if self.run_report_dir.exists():
            shutil.rmtree(self.run_report_dir)
        self.run_report_dir.mkdir(parents=True, exist_ok=True)

        await self._update_status("running")

        logger.info(
            "Starting run id=%s report_dir=%s cwd=%s",
            self.run_id,
            self.run_report_dir,
            REPO_ROOT,
        )

        with open(self.log_file_path, "w", encoding="utf-8") as log_file:
            cmd, config_path = self._build_command()
            logger.info(
                "Starting run id=%s command=%s cwd=%s",
                self.run_id,
                cmd,
                REPO_ROOT,
            )
            process: subprocess.Popen | None = None
            try:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=str(REPO_ROOT),
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    bufsize=1,
                )
                self.active_runs[self.run_id] = process

                merged = asyncio.Queue()
                loop = asyncio.get_running_loop()

                # Stream stdout and stderr concurrently via background threads.
                feeder_tasks = [
                    loop.run_in_executor(
                        None,
                        self._stream_reader,
                        process.stdout,
                        "stdout",
                        log_file,
                        merged,
                        loop,
                    ),
                    loop.run_in_executor(
                        None,
                        self._stream_reader,
                        process.stderr,
                        "stderr",
                        log_file,
                        merged,
                        loop,
                    ),
                ]

                done_count = 0
                while done_count < 2:
                    item = await merged.get()
                    if "__done__" in item:
                        done_count += 1
                    else:
                        item["timestamp"] = datetime.now(timezone.utc).isoformat()
                        yield item

                # Wait for feeders to finish and retrieve exit code.
                await asyncio.gather(*feeder_tasks)
                returncode = await loop.run_in_executor(None, process.wait)

            except asyncio.CancelledError:
                if process is not None and process.returncode is None:
                    process.kill()
                    await loop.run_in_executor(None, process.wait)
                await self._update_status("cancelled")
                raise
            except Exception as exc:
                logger.exception("Run id=%s encountered an error", self.run_id)
                if process is not None and process.returncode is None:
                    process.kill()
                    await loop.run_in_executor(None, process.wait)
                await self._update_status("error")
                error_msg = f"{type(exc).__name__}: {exc}"
                log_file.write(error_msg + "\n")
                log_file.flush()
                yield {"type": "error", "data": error_msg, "timestamp": datetime.now(timezone.utc).isoformat()}
                return
            finally:
                self.active_runs.pop(self.run_id, None)
                try:
                    config_path.unlink(missing_ok=True)
                except OSError as cleanup_exc:
                    logger.warning("Failed to remove temp config %s: %s", config_path, cleanup_exc)

            # Determine final status based on exit code.
            if returncode == 0:
                final_status = "completed"
            elif returncode > 0:
                final_status = "failed"
            else:
                final_status = "error"

            stats = self._parse_report()
            await self._update_status(final_status, **stats)

            yield {
                "type": "completed",
                "status": final_status,
                "stats": stats,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    @classmethod
    async def cancel_run(cls, run_id: int) -> bool:
        """Kill the subprocess (and its children on Windows) for a running run."""
        process = cls.active_runs.get(run_id)
        if process is None or process.returncode is not None:
            # Already finished or unknown run_id.
            async with AsyncSessionLocal() as session:
                try:
                    run = await session.get(Run, run_id)
                    if run is not None and run.status not in ("completed", "failed", "error", "cancelled"):
                        run.status = "cancelled"
                        run.completed_at = datetime.now(timezone.utc)
                        await session.commit()
                except Exception:
                    await session.rollback()
                    raise
            return True

        pid = process.pid
        logger.info("Cancelling run id=%s (pid=%s)", run_id, pid)

        loop = asyncio.get_running_loop()
        try:
            if sys.platform == "win32":
                # Kill the entire process tree on Windows.
                await loop.run_in_executor(
                    None,
                    lambda: subprocess.run(
                        ["taskkill", "/T", "/F", "/PID", str(pid)],
                        check=False,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                    ),
                )
            else:
                process.kill()

            # Wait a short time for the process to exit; don't block forever.
            try:
                await asyncio.wait_for(
                    loop.run_in_executor(None, process.wait), timeout=10.0
                )
            except asyncio.TimeoutError:
                logger.warning("Process for run id=%s did not exit within timeout", run_id)
        except ProcessLookupError:
            pass
        except Exception as exc:
            logger.warning("Error while cancelling run id=%s: %s", run_id, exc)
        finally:
            cls.active_runs.pop(run_id, None)

        async with AsyncSessionLocal() as session:
            try:
                run = await session.get(Run, run_id)
                if run is not None:
                    run.status = "cancelled"
                    run.completed_at = datetime.now(timezone.utc)
                    await session.commit()
            except Exception:
                await session.rollback()
                raise

        return True
