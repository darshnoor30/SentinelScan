"""
SentinelScan Database Configuration
-----------------------------------

Creates the SQLAlchemy engine, session factory, and database dependency.

Supports:
- Local SQLite development
- PostgreSQL production deployment
"""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import (
    Session,
    declarative_base,
    sessionmaker,
)

from src.utils.config import DATABASE_URL


def create_database_engine() -> Engine:
    """
    Create the SQLAlchemy engine using the configured database URL.

    SQLite requires check_same_thread=False.
    PostgreSQL does not accept that argument.
    """

    engine_options: dict = {
        "pool_pre_ping": True,
    }

    if DATABASE_URL.startswith("sqlite"):
        engine_options["connect_args"] = {
            "check_same_thread": False,
        }

    else:
        engine_options.update(
            {
                "pool_size": 5,
                "max_overflow": 10,
                "pool_recycle": 1800,
            }
        )

    return create_engine(
        DATABASE_URL,
        **engine_options,
    )


engine = create_database_engine()


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


Base = declarative_base()


def get_db() -> Generator[
    Session,
    None,
    None,
]:
    """
    Provide one database session per API request.

    The session is always closed after the request completes.
    """

    db = SessionLocal()

    try:
        yield db

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()