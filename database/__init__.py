"""
SentinelScan Database Initializer
---------------------------------

Loads SQLAlchemy models and creates missing database tables.
"""

from __future__ import annotations

from database.database import (
    Base,
    engine,
)

# Import models before create_all() so SQLAlchemy
# knows which tables must be created.
from database.models import ScanHistory  # noqa: F401


def create_database() -> None:
    """
    Create all database tables that do not already exist.
    """

    Base.metadata.create_all(
        bind=engine
    )