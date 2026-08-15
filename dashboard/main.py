"""
Playwright Test Command Center — FastAPI backend (Phase 2).

Serves a vanilla-JS dashboard for discovering, selecting, and triggering
Playwright test runs. Keeps run history and scheduled jobs in a local SQLite
database.
"""

from __future__ import annotations

import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from browser_detector import detect_browsers
from database import Run, TestFolder, get_db, init_db
from test_discovery import discover_tests
from test_runner import PlaywrightTestRunner
from websocket_manager import manager

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DASHBOARD_DIR = Path(__file__).resolve().parent
STATIC_DIR = DASHBOARD_DIR / "static"
TEMPLATES_DIR = DASHBOARD_DIR / "templates"

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class RunRequest(BaseModel):
    """Payload accepted by POST /api/run."""

    folder: str = Field(..., min_length=1, description="Folder/group name to run")
    browsers: list[str] = Field(default_factory=list, description="Browser project names")
    headed: bool = Field(default=False, description="Run tests in headed mode")


class ApiResponse(BaseModel):
    """Generic success envelope."""

    status: str
    data: Any | None = None
    message: str | None = None


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    logger.info("Starting Playwright Test Command Center")
    await init_db()
    yield
    logger.info("Shutting down Playwright Test Command Center")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Playwright Test Command Center",
    description="Dashboard for managing Playwright test executions.",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow the dashboard frontend and any tooling (e.g., local dev proxies) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", response_model=ApiResponse)
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "data": {"dashboard": "Playwright Test Command Center"},
    }


@app.get("/api/tests", response_model=ApiResponse)
async def get_tests(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """
    Discover Playwright tests, persist/update the folder cache, and return groups.
    """
    discovery = discover_tests("../tests")
    groups = discovery.get("groups", {})
    root = discovery.get("root", "")

    try:
        for folder_name, files in groups.items():
            folder_path = str(Path(root) / folder_name).replace("\\", "/")
            stmt = select(TestFolder).where(TestFolder.folder_name == folder_name)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                existing.folder_path = folder_path
                existing.test_files = json.dumps(files)
                existing.discovered_at = datetime.now(timezone.utc)
            else:
                db.add(
                    TestFolder(
                        folder_name=folder_name,
                        folder_path=folder_path,
                        test_files=json.dumps(files),
                    )
                )
        await db.commit()
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to cache discovered folders: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to cache test folders") from exc

    return {
        "status": "ok",
        "data": discovery,
    }


@app.get("/api/browsers", response_model=ApiResponse)
async def get_browsers() -> dict[str, Any]:
    """Return browser projects detected from playwright.config.js."""
    detection = detect_browsers("../playwright.config.js")
    return {
        "status": "ok",
        "data": detection,
    }


@app.post("/api/run", response_model=ApiResponse)
async def create_run(
    payload: RunRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Create a pending run record in the database and start execution in the background.

    The run is executed asynchronously; logs are streamed via WebSocket.
    """
    if not payload.folder:
        raise HTTPException(status_code=422, detail="folder is required")

    # Use a sensible default if no browsers are supplied.
    browsers = payload.browsers or ["chromium"]

    run = Run(
        folder_name=payload.folder,
        browsers=json.dumps(browsers),
        headed=payload.headed,
        status="pending",
    )
    db.add(run)

    try:
        await db.commit()
        await db.refresh(run)
    except Exception as exc:
        await db.rollback()
        logger.error("Failed to create run record: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create run record") from exc

    logger.info(
        "Created run id=%s folder=%s browsers=%s headed=%s (starting in background)",
        run.id,
        run.folder_name,
        browsers,
        run.headed,
    )

    # Kick off test execution without blocking the HTTP response.
    background_tasks.add_task(execute_run, run.id, run.folder_name, browsers, run.headed)

    return {
        "status": "ok",
        "data": {
            "run_id": run.id,
            "status": "started",
            "folder": run.folder_name,
            "browsers": browsers,
            "headed": run.headed,
        },
    }


async def execute_run(
    run_id: int,
    folder: str,
    browsers: list[str],
    headed: bool,
) -> None:
    """
    Background worker: execute Playwright tests and broadcast logs via WebSocket.
    """
    runner = PlaywrightTestRunner(
        run_id=run_id,
        folder=folder,
        browsers=browsers,
        headed=headed,
    )

    try:
        async for message in runner.run():
            await manager.broadcast_to_run(run_id, message)
    except Exception as exc:
        logger.exception("Background run id=%s failed", run_id)
        await manager.broadcast_to_run(
            run_id,
            {
                "type": "error",
                "data": str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


@app.websocket("/ws/run/{run_id}")
async def websocket_run(websocket: WebSocket, run_id: int) -> None:
    """WebSocket endpoint for streaming logs of a specific run."""
    await manager.connect(websocket, run_id)
    try:
        await websocket.send_json(
            {
                "type": "status",
                "status": "connected",
                "run_id": run_id,
            }
        )
        # Keep the socket alive and handle client pings/disconnects gracefully.
        while True:
            try:
                data = await websocket.receive_text()
                # Echo client messages as system logs (useful for heartbeats/debug).
                await manager.broadcast_to_run(
                    run_id,
                    {
                        "type": "system",
                        "data": f"client: {data}",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            except WebSocketDisconnect:
                break
    except Exception as exc:
        logger.debug("WebSocket error for run_id=%s: %s", run_id, exc)
    finally:
        manager.disconnect(websocket, run_id)


@app.delete("/api/run/{run_id}", response_model=ApiResponse)
async def cancel_run(run_id: int) -> dict[str, Any]:
    """Cancel a running test run by killing its subprocess."""
    cancelled = await PlaywrightTestRunner.cancel_run(run_id)
    if not cancelled:
        raise HTTPException(status_code=404, detail="Run not found or already finished")

    await manager.broadcast_to_run(
        run_id,
        {
            "type": "cancelled",
            "data": "Run cancelled by user",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return {
        "status": "ok",
        "data": {"run_id": run_id, "status": "cancelled"},
    }


# ---------------------------------------------------------------------------
# Static files & SPA fallback
# ---------------------------------------------------------------------------
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
else:
    logger.warning("Static directory not found at %s", STATIC_DIR)


@app.get("/")
async def serve_index() -> FileResponse:
    """Serve the dashboard single-page app."""
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Dashboard index.html not found")
    return FileResponse(index_file)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Catch-all to avoid leaking internal tracebacks to the client."""
    logger.exception("Unhandled error")
    status_code = 500
    detail = "Internal server error"
    if isinstance(exc, HTTPException):
        status_code = exc.status_code
        detail = exc.detail
    return JSONResponse(
        status_code=status_code,
        content={"status": "error", "message": detail},
    )


# ---------------------------------------------------------------------------
# Local development entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
