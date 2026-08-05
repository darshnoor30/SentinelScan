"""
SentinelScan API Routes
-----------------------

Endpoints for:

- Health monitoring
- URL scanning
- Scan history
- Individual scan details
- Scan deletion
- Dashboard statistics
- Analytics
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from database.analytics_crud import (
    get_daily_scans,
    get_prediction_distribution,
    get_recent_scans,
    get_risk_distribution,
    get_risk_range_distribution,
    get_top_domains,
)
from database.crud import (
    create_scan,
    delete_scan,
    get_scan_by_id,
    get_scan_history,
    get_statistics,
)
from database.database import get_db

from src.api.authentication import verify_api_key
from src.api.schemas import (
    DashboardResponse,
    DeleteScanResponse,
    HealthResponse,
    HistoryResponse,
    StatisticsResponse,
    URLScanRequest,
    URLScanResponse,
)
from src.prediction.predictor import predict_url
from src.utils.logger import security_logger


router = APIRouter(
    tags=["SentinelScan"],
)


# ============================================================================
# Shared dependencies and helpers
# ============================================================================

ApiKeyDependency = Depends(
    verify_api_key
)

DatabaseDependency = Depends(
    get_db
)


def utc_now() -> datetime:
    """
    Return a timezone-aware UTC timestamp.
    """

    return datetime.now(
        timezone.utc
    )


def validate_scan_id(
    scan_id: str,
) -> str:
    """
    Validate and normalize a UUID scan identifier.
    """

    try:
        return str(
            uuid.UUID(scan_id)
        )

    except (
        ValueError,
        TypeError,
        AttributeError,
    ) as error:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Invalid scan ID format."
            ),
        ) from error


def ensure_mapping(
    value: Any,
    *,
    error_message: str,
) -> dict[str, Any]:
    """
    Ensure a service returned a dictionary.
    """

    if not isinstance(
        value,
        dict,
    ):
        raise RuntimeError(
            error_message
        )

    return value


# ============================================================================
# Health check
# ============================================================================

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["Health"],
)
def health_check() -> dict[str, Any]:
    """
    Return basic API availability information.
    """

    return {
        "status": "running",
        "service": (
            "SentinelScan API"
        ),
        "version": "1.0.0",
        "timestamp": utc_now(),
    }


# ============================================================================
# URL scanner
# ============================================================================

@router.post(
    "/scan",
    response_model=URLScanResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    summary="Scan URL",
    tags=["Scanner"],
)
def scan_url(
    request: URLScanRequest,
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, Any]:
    """
    Analyse a URL, persist the result and return the saved scan.
    """

    scan_id = str(
        uuid.uuid4()
    )

    submitted_url = str(
        request.url
    )

    security_logger.info(
        (
            "API scan started | "
            "scan_id=%s | url=%s"
        ),
        scan_id,
        submitted_url,
    )

    try:
        prediction_result = (
            predict_url(
                submitted_url
            )
        )

        result = ensure_mapping(
            prediction_result,
            error_message=(
                "Prediction engine returned "
                "an invalid response."
            ),
        )

        # Copy the result so the route does not mutate
        # a shared dictionary from another service.
        result = dict(result)

        result.update(
            {
                "scan_id": scan_id,
                "scan_time": utc_now(),
                "url": (
                    result.get("url")
                    or submitted_url
                ),
            }
        )

        stored_scan = create_scan(
            db,
            result,
        )

        response_data = (
            stored_scan
            if isinstance(
                stored_scan,
                dict,
            )
            else result
        )

        security_logger.info(
            (
                "API scan completed | "
                "scan_id=%s | "
                "prediction=%s"
            ),
            scan_id,
            result.get(
                "prediction",
                "UNKNOWN",
            ),
        )

        return response_data

    except HTTPException:
        raise

    except Exception:
        security_logger.exception(
            (
                "Scan failed | "
                "scan_id=%s | url=%s"
            ),
            scan_id,
            submitted_url,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "The URL scan could not be completed. "
                "Check the server logs for details."
            ),
        )


# ============================================================================
# Scan history
# ============================================================================

@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Scan History",
    tags=["History"],
)
def history(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
        description=(
            "Maximum number of scan "
            "records to return."
        ),
    ),
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, Any]:
    """
    Return recently stored scan records.
    """

    try:
        scans = get_scan_history(
            db,
            limit,
        )

        safe_scans = (
            scans
            if isinstance(
                scans,
                list,
            )
            else list(
                scans or []
            )
        )

        return {
            "total": len(
                safe_scans
            ),
            "limit": limit,
            "scans": safe_scans,
        }

    except Exception:
        security_logger.exception(
            "History fetch failed"
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to fetch "
                "scan history."
            ),
        )


# ============================================================================
# Single scan details
# ============================================================================

@router.get(
    "/scan/{scan_id}",
    response_model=dict[
        str,
        Any,
    ],
    summary="Scan Details",
    tags=["History"],
)
def scan_details(
    scan_id: str,
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, Any]:
    """
    Return one stored scan.
    """

    normalized_scan_id = (
        validate_scan_id(
            scan_id
        )
    )

    try:
        scan = get_scan_by_id(
            db,
            normalized_scan_id,
        )

        if scan is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "Scan not found."
                ),
            )

        return scan

    except HTTPException:
        raise

    except Exception:
        security_logger.exception(
            (
                "Scan details failed | "
                "scan_id=%s"
            ),
            normalized_scan_id,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to fetch "
                "scan details."
            ),
        )


# ============================================================================
# Delete scan
# ============================================================================

@router.delete(
    "/scan/{scan_id}",
    response_model=(
        DeleteScanResponse
    ),
    summary="Delete Scan",
    tags=["History"],
)
def delete_scan_route(
    scan_id: str,
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, str]:
    """
    Permanently delete one stored scan.
    """

    normalized_scan_id = (
        validate_scan_id(
            scan_id
        )
    )

    try:
        deleted = delete_scan(
            db,
            normalized_scan_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "Scan not found."
                ),
            )

        security_logger.info(
            (
                "Scan deleted | "
                "scan_id=%s"
            ),
            normalized_scan_id,
        )

        return {
            "message": (
                "Scan deleted successfully."
            ),
            "scan_id": (
                normalized_scan_id
            ),
        }

    except HTTPException:
        raise

    except Exception:
        security_logger.exception(
            (
                "Scan deletion failed | "
                "scan_id=%s"
            ),
            normalized_scan_id,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to delete "
                "the scan."
            ),
        )


# ============================================================================
# Statistics
# ============================================================================

@router.get(
    "/statistics",
    response_model=(
        StatisticsResponse
    ),
    summary="Statistics",
    tags=["Analytics"],
)
def statistics(
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, Any]:
    """
    Return overall stored scan statistics.
    """

    try:
        result = get_statistics(
            db
        )

        return ensure_mapping(
            result,
            error_message=(
                "Statistics service "
                "returned an invalid response."
            ),
        )

    except Exception:
        security_logger.exception(
            (
                "Statistics generation "
                "failed"
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to generate "
                "statistics."
            ),
        )


# ============================================================================
# Dashboard
# ============================================================================

@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Dashboard",
    tags=["Dashboard"],
)
def dashboard(
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> dict[str, Any]:
    """
    Return the complete dashboard payload.
    """

    try:
        statistics_data = (
            get_statistics(
                db
            )
        )

        prediction_data = (
            get_prediction_distribution(
                db
            )
        )

        risk_data = (
            get_risk_distribution(
                db
            )
        )

        top_domains_data = (
            get_top_domains(
                db,
                limit=10,
            )
        )

        daily_scans_data = (
            get_daily_scans(
                db,
                days=30,
                include_empty_days=False,
            )
        )

        recent_scans_data = (
            get_recent_scans(
                db,
                limit=5,
            )
        )

        return {
            "statistics": (
                statistics_data
            ),
            "prediction_distribution": (
                prediction_data
            ),
            "risk_distribution": (
                risk_data
            ),
            "top_domains": (
                top_domains_data
            ),
            "daily_scans": (
                daily_scans_data
            ),
            "recent_scans": (
                recent_scans_data
            ),
        }

    except Exception:
        security_logger.exception(
            (
                "Dashboard generation "
                "failed"
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load "
                "dashboard."
            ),
        )


# ============================================================================
# Prediction distribution analytics
# ============================================================================

@router.get(
    "/analytics/prediction-distribution",
    response_model=list[
        dict[str, Any]
    ],
    summary=(
        "Prediction Distribution"
    ),
    tags=["Analytics"],
)
def prediction_distribution(
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> list[dict[str, Any]]:
    """
    Return scan counts grouped by final prediction.
    """

    try:
        distribution = (
            get_prediction_distribution(
                db
            )
        )

        return [
            {
                "prediction": (
                    "LEGITIMATE"
                ),
                "count": int(
                    distribution.get(
                        "LEGITIMATE",
                        0,
                    )
                ),
            },
            {
                "prediction": (
                    "SUSPICIOUS"
                ),
                "count": int(
                    distribution.get(
                        "SUSPICIOUS",
                        0,
                    )
                ),
            },
            {
                "prediction": (
                    "PHISHING"
                ),
                "count": int(
                    distribution.get(
                        "PHISHING",
                        0,
                    )
                ),
            },
        ]

    except Exception:
        security_logger.exception(
            (
                "Prediction-distribution "
                "analytics failed"
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to generate "
                "prediction distribution."
            ),
        )


# ============================================================================
# Risk distribution analytics
# ============================================================================

@router.get(
    "/analytics/risk-distribution",
    response_model=list[
        dict[str, Any]
    ],
    summary="Risk Distribution",
    tags=["Analytics"],
)
def risk_distribution(
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> list[dict[str, Any]]:
    """
    Return scan counts grouped by consistent numerical risk ranges.
    """

    try:
        return (
            get_risk_range_distribution(
                db
            )
        )

    except Exception:
        security_logger.exception(
            (
                "Risk-distribution "
                "analytics failed"
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to generate "
                "risk distribution."
            ),
        )


# ============================================================================
# Top-domain analytics
# ============================================================================

@router.get(
    "/analytics/top-domains",
    response_model=list[
        dict[str, Any]
    ],
    summary="Top Domains",
    tags=["Analytics"],
)
def top_domains(
    limit: int = Query(
        default=10,
        ge=1,
        le=20,
        description=(
            "Maximum number of "
            "domains to return."
        ),
    ),
    db: Session = DatabaseDependency,
    _: bool = ApiKeyDependency,
) -> list[dict[str, Any]]:
    """
    Return the most frequently scanned domains.
    """

    try:
        return get_top_domains(
            db,
            limit=limit,
        )

    except Exception:
        security_logger.exception(
            (
                "Top-domain analytics "
                "failed"
            )
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to generate "
                "top-domain analytics."
            ),
        )