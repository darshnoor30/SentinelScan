"""
SentinelScan Serializers
------------------------

Converts SQLAlchemy ScanHistory records into JSON-friendly dictionaries.
"""

from __future__ import annotations

import json
from typing import Any, Iterable

from database.models import ScanHistory


def safe_json_loads(
    value: Any,
    default: Any,
) -> Any:
    """
    Safely deserialize stored JSON text.

    If the value is already a dictionary or list, it is returned directly.
    Invalid JSON falls back to the supplied default.
    """

    if value is None:
        return default

    if isinstance(value, (dict, list)):
        return value

    if not isinstance(value, str):
        return default

    cleaned = value.strip()

    if not cleaned:
        return default

    try:
        return json.loads(cleaned)

    except (json.JSONDecodeError, TypeError):
        return default


def normalize_reasons(value: Any) -> list[str]:
    """
    Return a clean, deduplicated list of reason strings.
    """

    parsed = safe_json_loads(
        value,
        [],
    )

    if not isinstance(parsed, list):
        return []

    cleaned: list[str] = []
    seen: set[str] = set()

    for reason in parsed:
        text = str(reason or "").strip()

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
    Return threat-intelligence data as a dictionary.
    """

    parsed = safe_json_loads(
        value,
        {},
    )

    return (
        parsed
        if isinstance(parsed, dict)
        else {}
    )


def serialize_scan(
    scan: ScanHistory,
) -> dict[str, Any]:
    """
    Convert one ScanHistory SQLAlchemy object into a dictionary.
    """

    if scan is None:
        raise ValueError(
            "Cannot serialize an empty scan record."
        )

    return {
        "id": scan.id,
        "scan_id": scan.scan_id,
        "scan_time": scan.scan_time,
        "url": scan.url,

        "raw_ml_prediction": getattr(
            scan,
            "raw_ml_prediction",
            None,
        ),

        "ml_prediction": scan.ml_prediction,
        "prediction": scan.prediction,
        "confidence": float(
            scan.confidence or 0
        ),
        "risk_score": float(
            scan.risk_score or 0
        ),
        "severity": scan.severity,
        "reasons": normalize_reasons(
            scan.reasons
        ),
        "threat_intelligence": (
            normalize_threat_intelligence(
                scan.threat_intelligence
            )
        ),
        "created_at": scan.created_at,
    }


def serialize_scans(
    scans: Iterable[ScanHistory],
) -> list[dict[str, Any]]:
    """
    Convert multiple ScanHistory objects into dictionaries.
    """

    if scans is None:
        return []

    return [
        serialize_scan(scan)
        for scan in scans
        if scan is not None
    ]