"""
SentinelScan Database Models
----------------------------

SQLAlchemy models used by the SentinelScan backend.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)

from database.database import Base


def utc_now() -> datetime:
    """
    Return a timezone-aware UTC timestamp.
    """

    return datetime.now(timezone.utc)


class ScanHistory(Base):
    """
    Stored result of one SentinelScan URL analysis.
    """

    __tablename__ = "scan_history"

    __table_args__ = (
        CheckConstraint(
            "confidence >= 0 AND confidence <= 100",
            name="ck_scan_history_confidence_range",
        ),
        CheckConstraint(
            "risk_score >= 0 AND risk_score <= 100",
            name="ck_scan_history_risk_score_range",
        ),
        CheckConstraint(
            (
                "prediction IN "
                "('LEGITIMATE', 'SUSPICIOUS', 'PHISHING', 'UNKNOWN')"
            ),
            name="ck_scan_history_prediction",
        ),
        CheckConstraint(
            (
                "severity IN "
                "('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN')"
            ),
            name="ck_scan_history_severity",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    scan_id = Column(
        String(36),
        unique=True,
        nullable=False,
        index=True,
    )

    scan_time = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )

    url = Column(
        Text,
        nullable=False,
    )

    raw_ml_prediction = Column(
        String(50),
        nullable=True,
    )

    ml_prediction = Column(
        String(50),
        nullable=True,
    )

    prediction = Column(
        String(50),
        nullable=False,
        index=True,
    )

    confidence = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    risk_score = Column(
        Float,
        nullable=False,
        default=0.0,
        index=True,
    )

    severity = Column(
        String(20),
        nullable=False,
        index=True,
    )

    reasons = Column(
        Text,
        nullable=True,
    )

    threat_intelligence = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True,
    )