"""
Test discovery utilities for the Playwright Test Command Center.

Scans the repository's Playwright tests directory and groups `.spec.js`
files by their immediate parent folder. Files placed directly under the
root `tests/` folder are grouped as "uncategorized".
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Default root is the repo-level `tests/` folder, one level above `dashboard/`.
DEFAULT_TESTS_ROOT = Path(__file__).resolve().parent.parent / "tests"


def discover_tests(tests_root: str = "../tests") -> dict[str, Any]:
    """
    Recursively discover all `.spec.js` files under ``tests_root``.

    Files are grouped by the name of their immediate parent directory. Files
    that live directly inside ``tests_root`` are placed under the
    ``uncategorized`` group.

    Parameters
    ----------
    tests_root:
        Path to the Playwright tests directory. Relative paths are resolved
        from the ``dashboard/`` directory. Defaults to ``../tests``.

    Returns
    -------
    A dictionary with the following keys:
        - ``groups``: dict[str, list[str]] mapping folder name -> relative paths.
        - ``flat``: list[str] of all discovered test files relative to ``tests_root``.
        - ``root``: absolute path to the resolved ``tests_root``.
        - ``total``: total number of discovered test files.
    """
    root_path = Path(tests_root)
    if not root_path.is_absolute():
        root_path = (Path(__file__).resolve().parent / root_path).resolve()

    result: dict[str, list[str]] = {}
    flat: list[str] = []

    try:
        if not root_path.exists():
            raise FileNotFoundError(f"Tests directory not found: {root_path}")

        for spec_file in sorted(root_path.rglob("*.spec.js")):
            try:
                relative = spec_file.relative_to(root_path)
                flat.append(str(relative).replace("\\", "/"))

                # Determine group: immediate parent folder name, or "uncategorized"
                # if the file lives directly inside tests_root.
                parts = relative.parts
                if len(parts) == 1:
                    group_name = "uncategorized"
                else:
                    group_name = parts[0]

                result.setdefault(group_name, []).append(
                    str(relative).replace("\\", "/")
                )
            except ValueError as exc:
                logger.warning("Skipping file outside tests root: %s (%s)", spec_file, exc)
                continue

    except FileNotFoundError as exc:
        logger.warning("%s", exc)
        return {
            "groups": {},
            "flat": [],
            "root": str(root_path).replace("\\", "/"),
            "total": 0,
        }
    except PermissionError as exc:
        logger.error("Permission denied reading tests directory: %s", exc)
        return {
            "groups": {},
            "flat": [],
            "root": str(root_path).replace("\\", "/"),
            "total": 0,
        }

    # Ensure "uncategorized" exists in the response even if empty.
    if "uncategorized" not in result:
        result["uncategorized"] = []

    return {
        "groups": result,
        "flat": flat,
        "root": str(root_path).replace("\\", "/"),
        "total": len(flat),
    }
