"""
Async SQLite database layer for the Playwright Test Command Center.

Uses SQLAlchemy 2.0 async ORM with aiosqlite. All table definitions and
session utilities live here so the rest of the dashboard imports them.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator, Any

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    event,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

logger = logging.getLogger(__name__)

# Database path: inside dashboard/ regardless of where the app is launched from.
DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "testcenter.db"
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# SQLAlchemy async engine and session factory.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


class Run(Base):
    """Represents a single Playwright test execution."""

    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    folder_name = Column(String(255), nullable=False, index=True)
    browsers = Column(Text, nullable=False)  # JSON list
    headed = Column(Boolean, default=False, nullable=False)
    status = Column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )  # pending / running / completed / failed
    total_tests = Column(Integer, nullable=True)
    passed = Column(Integer, nullable=True)
    failed = Column(Integer, nullable=True)
    skipped = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    report_html_path = Column(String(512), nullable=True)
    report_json_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "folder_name": self.folder_name,
            "browsers": json.loads(self.browsers) if self.browsers else [],
            "headed": self.headed,
            "status": self.status,
            "total_tests": self.total_tests,
            "passed": self.passed,
            "failed": self.failed,
            "skipped": self.skipped,
            "duration_ms": self.duration_ms,
            "report_html_path": self.report_html_path,
            "report_json_path": self.report_json_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class Schedule(Base):
    """Represents a scheduled (cron-based) test run."""

    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    folder_name = Column(String(255), nullable=False, index=True)
    browsers = Column(Text, nullable=False)  # JSON list
    headed = Column(Boolean, default=False, nullable=False)
    cron_expression = Column(String(128), nullable=False)
    email_recipients = Column(Text, nullable=True)  # comma-separated
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "folder_name": self.folder_name,
            "browsers": json.loads(self.browsers) if self.browsers else [],
            "headed": self.headed,
            "cron_expression": self.cron_expression,
            "email_recipients": self.email_recipients,
            "is_active": self.is_active,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TestFolder(Base):
    """Cached result of the latest test discovery scan."""

    __tablename__ = "test_folders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    folder_name = Column(String(255), nullable=False, unique=True, index=True)
    folder_path = Column(String(512), nullable=False)
    test_files = Column(Text, nullable=False)  # JSON list
    discovered_at = Column(
        DateTime,
        default=datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "folder_name": self.folder_name,
            "folder_path": self.folder_path,
            "test_files": json.loads(self.test_files) if self.test_files else [],
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
        }


# Enforce foreign key support for SQLite (aiosqlite inherits PRAGMA settings).
@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _):
    """Enable SQLite foreign key constraints on every connection."""
    try:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception as exc:  # pragma: no cover
        logger.warning("Could not enable SQLite foreign keys: %s", exc)


async def init_db() -> None:
    """Create all tables if they do not already exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized at %s", DB_PATH)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
