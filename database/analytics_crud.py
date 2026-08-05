"""
SentinelScan Analytics CRUD
---------------------------

Database analytics used by the dashboard.

Responsibilities:
- Prediction distribution
- Risk distribution
- Daily scan trends
- Top scanned domains
- Average risk score
- Recent scan records
"""

from __future__ import annotations

from collections import Counter
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy import (
    case,
    func,
)
from sqlalchemy.orm import Session

from database.models import ScanHistory
from database.serializers import serialize_scans


# ============================================================================
# Shared risk boundaries
# ============================================================================

LOW_MAX = 25
MEDIUM_MAX = 50
HIGH_MAX = 75


def utc_now() -> datetime:
    """
    Return the current UTC timestamp.
    """

    return datetime.now(timezone.utc)


def clamp_score(value: Any) -> float:
    """
    Convert a risk score into a safe value from 0 to 100.
    """

    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0.0

    return min(
        100.0,
        max(0.0, score),
    )


def normalize_limit(
    value: Any,
    *,
    default: int,
    maximum: int,
) -> int:
    """
    Normalize query limits used by analytics functions.
    """

    try:
        limit = int(value)
    except (TypeError, ValueError):
        limit = default

    return min(
        maximum,
        max(1, limit),
    )


def extract_domain(url: Any) -> str | None:
    """
    Extract and normalize a hostname from a stored URL.
    """

    raw_url = str(url or "").strip()

    if not raw_url:
        return None

    candidate = (
        raw_url
        if "://" in raw_url
        else f"https://{raw_url}"
    )

    try:
        hostname = (
            urlsplit(candidate).hostname
            or ""
        ).strip().lower()

        if not hostname:
            return None

        if hostname.startswith("www."):
            hostname = hostname[4:]

        return hostname or None

    except (TypeError, ValueError):
        return None


# ============================================================================
# Prediction distribution
# ============================================================================

def get_prediction_distribution(
    db: Session,
) -> dict[str, int]:
    """
    Return scan counts grouped by final prediction.

    All expected prediction labels are always included.
    """

    rows = (
        db.query(
            ScanHistory.prediction,
            func.count(
                ScanHistory.id
            ).label("count"),
        )
        .group_by(
            ScanHistory.prediction
        )
        .all()
    )

    distribution = {
        "LEGITIMATE": 0,
        "SUSPICIOUS": 0,
        "PHISHING": 0,
    }

    for prediction, count in rows:
        normalized = str(
            prediction or ""
        ).strip().upper()

        if normalized in distribution:
            distribution[normalized] = int(
                count or 0
            )

    return distribution


# ============================================================================
# Risk distribution
# ============================================================================

def get_risk_distribution(
    db: Session,
) -> dict[str, int]:
    """
    Return risk counts using one consistent classification:

    LOW:       0–25
    MEDIUM:   26–50
    HIGH:     51–75
    CRITICAL: 76–100
    """

    result = (
        db.query(
            func.sum(
                case(
                    (
                        ScanHistory.risk_score
                        <= LOW_MAX,
                        1,
                    ),
                    else_=0,
                )
            ).label("low"),

            func.sum(
                case(
                    (
                        (
                            ScanHistory.risk_score
                            > LOW_MAX
                        )
                        & (
                            ScanHistory.risk_score
                            <= MEDIUM_MAX
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("medium"),

            func.sum(
                case(
                    (
                        (
                            ScanHistory.risk_score
                            > MEDIUM_MAX
                        )
                        & (
                            ScanHistory.risk_score
                            <= HIGH_MAX
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("high"),

            func.sum(
                case(
                    (
                        ScanHistory.risk_score
                        > HIGH_MAX,
                        1,
                    ),
                    else_=0,
                )
            ).label("critical"),
        )
        .first()
    )

    if result is None:
        return {
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "CRITICAL": 0,
        }

    return {
        "LOW": int(
            result.low or 0
        ),
        "MEDIUM": int(
            result.medium or 0
        ),
        "HIGH": int(
            result.high or 0
        ),
        "CRITICAL": int(
            result.critical or 0
        ),
    }


# ============================================================================
# Numerical risk ranges
# ============================================================================

def get_risk_range_distribution(
    db: Session,
) -> list[dict[str, int | str]]:
    """
    Return numerical risk ranges for the standalone analytics endpoint.

    The boundaries match the dashboard severity categories.
    """

    distribution = (
        get_risk_distribution(db)
    )

    return [
        {
            "range": "0-25",
            "count": distribution["LOW"],
        },
        {
            "range": "26-50",
            "count": distribution["MEDIUM"],
        },
        {
            "range": "51-75",
            "count": distribution["HIGH"],
        },
        {
            "range": "76-100",
            "count": distribution["CRITICAL"],
        },
    ]


# ============================================================================
# Top domains
# ============================================================================

def get_top_domains(
    db: Session,
    limit: int = 10,
) -> list[dict[str, int | str]]:
    """
    Return the most frequently scanned domains.
    """

    safe_limit = normalize_limit(
        limit,
        default=10,
        maximum=20,
    )

    rows = (
        db.query(
            ScanHistory.url
        )
        .filter(
            ScanHistory.url.isnot(None)
        )
        .all()
    )

    counter: Counter[str] = Counter()

    for row in rows:
        domain = extract_domain(
            row.url
        )

        if domain:
            counter[domain] += 1

    return [
        {
            "domain": domain,
            "count": int(count),
        }
        for domain, count
        in counter.most_common(
            safe_limit
        )
    ]


# ============================================================================
# Daily scan trend
# ============================================================================

def get_daily_scans(
    db: Session,
    days: int = 30,
    include_empty_days: bool = False,
) -> list[dict[str, int | str]]:
    """
    Return daily scan counts for the requested number of calendar days.

    `days=30` means today plus the previous 29 calendar days.
    """

    safe_days = normalize_limit(
        days,
        default=30,
        maximum=365,
    )

    today = utc_now().date()

    start_day = (
        today
        - timedelta(
            days=safe_days - 1
        )
    )

    start_datetime = datetime.combine(
        start_day,
        datetime.min.time(),
        tzinfo=timezone.utc,
    )

    rows = (
        db.query(
            func.date(
                ScanHistory.created_at
            ).label("scan_date"),
            func.count(
                ScanHistory.id
            ).label("scan_count"),
        )
        .filter(
            ScanHistory.created_at
            >= start_datetime
        )
        .group_by(
            func.date(
                ScanHistory.created_at
            )
        )
        .order_by(
            func.date(
                ScanHistory.created_at
            ).asc()
        )
        .all()
    )

    counts_by_date = {
        str(scan_date): int(
            scan_count or 0
        )
        for scan_date, scan_count
        in rows
    }

    if not include_empty_days:
        return [
            {
                "date": date,
                "count": count,
            }
            for date, count
            in counts_by_date.items()
        ]

    trend: list[
        dict[str, int | str]
    ] = []

    for offset in range(safe_days):
        current_day = (
            start_day
            + timedelta(days=offset)
        )

        date_key = (
            current_day.isoformat()
        )

        trend.append(
            {
                "date": date_key,
                "count": counts_by_date.get(
                    date_key,
                    0,
                ),
            }
        )

    return trend


# ============================================================================
# Average risk
# ============================================================================

def get_average_risk(
    db: Session,
) -> float:
    """
    Return the average risk score across all stored scans.
    """

    average = (
        db.query(
            func.avg(
                ScanHistory.risk_score
            )
        )
        .scalar()
    )

    return round(
        float(average or 0),
        2,
    )


# ============================================================================
# Recent scans
# ============================================================================

def get_recent_scans(
    db: Session,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """
    Return the most recently stored scans.
    """

    safe_limit = normalize_limit(
        limit,
        default=5,
        maximum=50,
    )

    scans = (
        db.query(
            ScanHistory
        )
        .order_by(
            ScanHistory.created_at.desc(),
            ScanHistory.id.desc(),
        )
        .limit(safe_limit)
        .all()
    )

    return serialize_scans(scans)