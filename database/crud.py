"""
SentinelScan Database CRUD Layer
--------------------------------

Database operations for:

- Creating scan records
- Reading scan history
- Reading individual scans
- Deleting scan records
- Calculating dashboard statistics
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from database.models import ScanHistory
from database.serializers import (
    serialize_scan,
    serialize_scans,
)


# ============================================================================
# Helpers
# ============================================================================

def utc_now() -> datetime:
    """
    Return a timezone-aware UTC timestamp.
    """

    return datetime.now(timezone.utc)


def safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Convert a value to float without raising an exception.
    """

    try:
        return float(value)

    except (TypeError, ValueError):
        return default


def clamp_percentage(value: Any) -> float:
    """
    Convert a value into a percentage between 0 and 100.
    """

    number = safe_float(value)

    return round(
        min(100.0, max(0.0, number)),
        2,
    )


def normalize_text(
    value: Any,
    default: str = "",
) -> str:
    """
    Convert a value into a clean string.
    """

    text = str(
        value
        if value is not None
        else default
    ).strip()

    return text or default


def normalize_reasons(
    value: Any,
) -> list[str]:
    """
    Normalize, clean and deduplicate detection reasons.
    """

    if not isinstance(
        value,
        (list, tuple),
    ):
        return []

    cleaned: list[str] = []
    seen: set[str] = set()

    for reason in value:
        text = str(
            reason or ""
        ).strip()

        if not text:
            continue

        normalized = " ".join(
            text.lower().split()
        )

        if normalized in seen:
            continue

        seen.add(normalized)
        cleaned.append(text)

    return cleaned


def normalize_threat_intelligence(
    value: Any,
) -> dict[str, Any]:
    """
    Ensure threat-intelligence data is a dictionary.
    """

    if not isinstance(value, dict):
        return {}

    return value


def json_dumps(
    value: Any,
) -> str:
    """
    Serialize JSON safely.

    default=str prevents datetime-like values or uncommon numeric objects
    from crashing database insertion.
    """

    return json.dumps(
        value,
        ensure_ascii=False,
        default=str,
    )


# ============================================================================
# Create scan
# ============================================================================

def create_scan(
    db: Session,
    scan_data: dict[str, Any],
) -> dict[str, Any]:
    """
    Create and persist one scan record.

    Returns the serialized database record rather than the raw SQLAlchemy
    object so the API layer can safely return it.
    """

    if not isinstance(scan_data, dict):
        raise TypeError(
            "Scan data must be a dictionary."
        )

    scan_id = normalize_text(
        scan_data.get("scan_id")
    )

    url = normalize_text(
        scan_data.get("url")
    )

    if not scan_id:
        raise ValueError(
            "scan_id is required."
        )

    if not url:
        raise ValueError(
            "url is required."
        )

    scan_time = scan_data.get(
        "scan_time"
    )

    if not isinstance(
        scan_time,
        datetime,
    ):
        scan_time = utc_now()

    reasons = normalize_reasons(
        scan_data.get("reasons")
    )

    threat_intelligence = (
        normalize_threat_intelligence(
            scan_data.get(
                "threat_intelligence"
            )
        )
    )

    prediction = normalize_text(
        scan_data.get("prediction"),
        "UNKNOWN",
    ).upper()

    ml_prediction = normalize_text(
        scan_data.get("ml_prediction"),
        "",
    ).upper() or None

    severity = normalize_text(
        scan_data.get("severity"),
        "UNKNOWN",
    ).upper()

    try:
        scan = ScanHistory(
            scan_id=scan_id,
            scan_time=scan_time,
            url=url,
            raw_ml_prediction=normalize_text(
    scan_data.get("raw_ml_prediction"),
    "",
) or None,
            ml_prediction=ml_prediction,
            prediction=prediction,
            confidence=clamp_percentage(
                scan_data.get(
                    "confidence"
                )
            ),
            risk_score=clamp_percentage(
                scan_data.get(
                    "risk_score"
                )
            ),
            severity=severity,
            reasons=json_dumps(
                reasons
            ),
            threat_intelligence=json_dumps(
                threat_intelligence
            ),
        )

        db.add(scan)
        db.commit()
        db.refresh(scan)

        return serialize_scan(scan)

    except Exception:
        db.rollback()
        raise


# ============================================================================
# Scan history
# ============================================================================

def get_scan_history(
    db: Session,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Return recent scan records ordered from newest to oldest.
    """

    safe_limit = min(
        200,
        max(1, int(limit)),
    )

    scans = (
        db.query(ScanHistory)
        .order_by(
            ScanHistory.created_at.desc(),
            ScanHistory.id.desc(),
        )
        .limit(safe_limit)
        .all()
    )

    return serialize_scans(scans)


# ============================================================================
# Single scan
# ============================================================================

def get_scan_by_id(
    db: Session,
    scan_id: str,
) -> dict[str, Any] | None:
    """
    Return one scan by UUID.
    """

    normalized_scan_id = (
        normalize_text(scan_id)
    )

    if not normalized_scan_id:
        return None

    scan = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.scan_id
            == normalized_scan_id
        )
        .first()
    )

    if scan is None:
        return None

    return serialize_scan(scan)


# ============================================================================
# Delete scan
# ============================================================================

def delete_scan(
    db: Session,
    scan_id: str,
) -> bool:
    """
    Delete one scan record.

    Returns True if a row was removed and False if the scan did not exist.
    """

    normalized_scan_id = (
        normalize_text(scan_id)
    )

    if not normalized_scan_id:
        return False

    try:
        scan = (
            db.query(ScanHistory)
            .filter(
                ScanHistory.scan_id
                == normalized_scan_id
            )
            .first()
        )

        if scan is None:
            return False

        db.delete(scan)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise


# ============================================================================
# Dashboard statistics
# ============================================================================

def get_statistics(
    db: Session,
) -> dict[str, int | float]:
    """
    Return global scan statistics calculated directly by the database.
    """

    result = (
        db.query(
            func.count(
                ScanHistory.id
            ).label("total"),

            func.sum(
                case(
                    (
                        ScanHistory.prediction
                        == "PHISHING",
                        1,
                    ),
                    else_=0,
                )
            ).label("phishing"),

            func.sum(
                case(
                    (
                        ScanHistory.prediction
                        == "SUSPICIOUS",
                        1,
                    ),
                    else_=0,
                )
            ).label("suspicious"),

            func.sum(
                case(
                    (
                        ScanHistory.prediction
                        == "LEGITIMATE",
                        1,
                    ),
                    else_=0,
                )
            ).label("legitimate"),

            func.avg(
                ScanHistory.risk_score
            ).label("average"),
        )
        .first()
    )

    if result is None:
        return {
            "total_scans": 0,
            "phishing_detected": 0,
            "suspicious_detected": 0,
            "legitimate_detected": 0,
            "average_risk_score": 0.0,
        }

    return {
        "total_scans": int(
            result.total or 0
        ),
        "phishing_detected": int(
            result.phishing or 0
        ),
        "suspicious_detected": int(
            result.suspicious or 0
        ),
        "legitimate_detected": int(
            result.legitimate or 0
        ),
        "average_risk_score": round(
            float(
                result.average or 0
            ),
            2,
        ),
    }