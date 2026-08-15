"""
WebSocket connection manager for the Playwright Test Command Center.

Maintains a mapping of run_id -> active WebSocket connections and broadcasts
JSON messages to all clients following a specific run.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from starlette.websockets import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections grouped by run_id."""

    def __init__(self) -> None:
        # run_id -> list of connected WebSockets
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, run_id: int) -> None:
        """Accept a WebSocket and register it under a run_id."""
        await websocket.accept()
        self.active_connections.setdefault(run_id, []).append(websocket)
        logger.info("WebSocket connected for run_id=%s (total=%s)", run_id, len(self.active_connections[run_id]))

    def disconnect(self, websocket: WebSocket, run_id: int) -> None:
        """Remove a WebSocket from a run_id group."""
        connections = self.active_connections.get(run_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(run_id, None)
        logger.info("WebSocket disconnected from run_id=%s", run_id)

    async def broadcast_to_run(self, run_id: int, message: dict[str, Any]) -> None:
        """Send a JSON message to all websockets subscribed to a run_id."""
        connections = self.active_connections.get(run_id, [])
        if not connections:
            return

        text = json.dumps(message)
        # Send to all connections concurrently; isolate failures so one bad
        # socket does not break delivery to others.
        results = await asyncio.gather(
            *[self._send_safe(ws, text) for ws in connections],
            return_exceptions=True,
        )

        # Drop connections that failed to receive the message.
        dead_sockets = [ws for ws, result in zip(connections, results) if isinstance(result, Exception)]
        for ws in dead_sockets:
            self.disconnect(ws, run_id)

    async def _send_safe(self, websocket: WebSocket, text: str) -> None:
        """Send text to a single socket, raising on failure."""
        await websocket.send_text(text)


# Singleton instance used across the application.
manager = ConnectionManager()

