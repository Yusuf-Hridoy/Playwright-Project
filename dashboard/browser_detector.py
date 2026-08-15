"""
Browser project detector for the Playwright Test Command Center.

Parses the repository's `playwright.config.js` and extracts the list of
project names defined in the `projects:` array. Falls back to a sensible
default list if the config is missing or cannot be parsed.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_BROWSERS = [
    "chromium",
    "firefox",
    "webkit",
    "Google Chrome",
    "Microsoft Edge",
    "Mobile Chrome",
]

DEFAULT_BROWSER = "chromium"

# Path to the Playwright config, relative to the dashboard folder.
DEFAULT_CONFIG_PATH = "../playwright.config.js"


def _resolve_path(config_path: str) -> Path:
    """Resolve the config path relative to this module's directory."""
    path = Path(config_path)
    if not path.is_absolute():
        path = (Path(__file__).resolve().parent / path).resolve()
    return path


def _extract_projects_block(text: str) -> str | None:
    """
    Extract the contents of the `projects:` array from the config text.

    Uses brace counting to find the matching closing bracket, which handles
    nested object literals such as `use: { ...devices['Desktop Chrome'] }`.
    """
    match = re.search(r"projects\s*:\s*\[", text)
    if not match:
        return None

    start = match.end()
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        char = text[i]
        if char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
        elif char == '"':
            # Skip double-quoted strings.
            i += 1
            while i < len(text) and text[i] != '"':
                if text[i] == "\\" and i + 1 < len(text):
                    i += 1
                i += 1
        elif char == "'":
            # Skip single-quoted strings.
            i += 1
            while i < len(text) and text[i] != "'":
                if text[i] == "\\" and i + 1 < len(text):
                    i += 1
                i += 1
        elif char == "`":
            # Skip template literals.
            i += 1
            while i < len(text) and text[i] != "`":
                if text[i] == "\\" and i + 1 < len(text):
                    i += 1
                i += 1
        i += 1

    if depth != 0:
        logger.warning("Could not find matching closing bracket for projects array")
        return None

    return text[start:i]


def _strip_single_line_comments(text: str) -> str:
    """Remove `//` comments from each line while preserving string contents."""
    lines: list[str] = []
    for line in text.splitlines():
        cleaned = []
        i = 0
        while i < len(line):
            char = line[i]
            if char == '"':
                # Skip double-quoted string.
                cleaned.append(char)
                i += 1
                while i < len(line) and line[i] != '"':
                    if line[i] == "\\" and i + 1 < len(line):
                        cleaned.append(line[i])
                        i += 1
                    cleaned.append(line[i])
                    i += 1
                if i < len(line):
                    cleaned.append(line[i])
                    i += 1
            elif char == "'":
                # Skip single-quoted string.
                cleaned.append(char)
                i += 1
                while i < len(line) and line[i] != "'":
                    if line[i] == "\\" and i + 1 < len(line):
                        cleaned.append(line[i])
                        i += 1
                    cleaned.append(line[i])
                    i += 1
                if i < len(line):
                    cleaned.append(line[i])
                    i += 1
            elif char == "/" and i + 1 < len(line) and line[i + 1] == "/":
                break
            else:
                cleaned.append(char)
                i += 1
        lines.append("".join(cleaned))
    return "\n".join(lines)


def _extract_names_and_channels(block: str) -> tuple[list[str], set[str]]:
    """
    Extract project names and channel declarations from a projects block.

    Single-line comments are ignored so commented-out projects are not returned.

    Returns a tuple of (names, channels).
    """
    names: list[str] = []
    channels: set[str] = set()

    cleaned_block = _strip_single_line_comments(block)

    # Match quoted name values: name: 'foo', name: "foo", or name: `foo`.
    for match in re.finditer(r"name\s*:\s*['\"`]([^'\"`]+)['\"`]", cleaned_block):
        names.append(match.group(1).strip())

    # Detect channel declarations such as channel: 'chrome' or channel: "msedge".
    for match in re.finditer(r"channel\s*:\s*['\"`]([^'\"`]+)['\"`]", cleaned_block):
        channels.add(match.group(1).strip().lower())

    return names, channels


def detect_browsers(config_path: str = DEFAULT_CONFIG_PATH) -> dict[str, Any]:
    """
    Detect browser projects from the Playwright configuration file.

    Parameters
    ----------
    config_path:
        Path to `playwright.config.js`. Relative paths are resolved from the
        ``dashboard/`` directory. Defaults to ``../playwright.config.js``.

    Returns
    -------
    Dictionary with keys:
        - ``browsers``: list of detected browser project names.
        - ``default``: recommended default browser.
        - ``channels``: set/list of detected channel declarations.
        - ``source``: "config" if parsed from file, otherwise "default".
    """
    path = _resolve_path(config_path)

    if not path.exists():
        logger.warning("Playwright config not found at %s; using default browser list", path)
        return {
            "browsers": DEFAULT_BROWSERS.copy(),
            "default": DEFAULT_BROWSER,
            "channels": [],
            "source": "default",
        }

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        logger.error("Failed to read Playwright config: %s", exc)
        return {
            "browsers": DEFAULT_BROWSERS.copy(),
            "default": DEFAULT_BROWSER,
            "channels": [],
            "source": "default",
        }

    block = _extract_projects_block(text)
    if block is None:
        logger.warning("No 'projects' array found in %s; using default browser list", path)
        return {
            "browsers": DEFAULT_BROWSERS.copy(),
            "default": DEFAULT_BROWSER,
            "channels": [],
            "source": "default",
        }

    names, channels = _extract_names_and_channels(block)

    # If no names were extracted, fall back to defaults.
    if not names:
        logger.warning("No project names extracted from %s; using default browser list", path)
        return {
            "browsers": DEFAULT_BROWSERS.copy(),
            "default": DEFAULT_BROWSER,
            "channels": sorted(channels),
            "source": "default",
        }

    # Add common branded browsers if their channels are detected but not already listed.
    channel_map = {
        "chrome": "Google Chrome",
        "msedge": "Microsoft Edge",
    }
    for channel, display_name in channel_map.items():
        if channel in channels and display_name not in names:
            names.append(display_name)

    return {
        "browsers": names,
        "default": DEFAULT_BROWSER,
        "channels": sorted(channels),
        "source": "config",
    }
