"""
SentinelScan API Schemas
------------------------

Pydantic request and response models used by the SentinelScan API.

Responsibilities:
- Validate URL scan requests
- Document API responses
- Enforce prediction and severity labels
- Validate confidence and risk-score ranges
- Normalize detection reasons
- Structure threat-intelligence responses
"""

from __future__ import annotations

import ipaddress
from datetime import datetime
from typing import Any, Literal
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# ============================================================================
# Shared types
# ============================================================================

PredictionLabel = Literal[
    "LEGITIMATE",
    "SUSPICIOUS",
    "PHISHING",
]

MLPredictionLabel = Literal[
    "LEGITIMATE",
    "PHISHING",
]

SeverityLabel = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
    "UNKNOWN",
]


# ============================================================================
# Shared base configuration
# ============================================================================

class StrictRequestModel(BaseModel):
    """
    Base model for API request bodies.

    Unknown request fields are rejected to prevent accidental or malformed
    input from silently entering the application.
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class ResponseModel(BaseModel):
    """
    Base model for API responses.

    Unknown internal fields are ignored so database or service-layer metadata
    does not unexpectedly break API serialization.
    """

    model_config = ConfigDict(
        from_attributes=True,
        extra="ignore",
    )


# ============================================================================
# URL scan request
# ============================================================================

class URLScanRequest(StrictRequestModel):
    """
    Request body accepted by POST /scan.
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "url": "https://github.com"
                },
                {
                    "url": "https://google.com"
                },
            ]
        },
    )

    url: str = Field(
        ...,
        min_length=3,
        max_length=2048,
        description=(
            "Public HTTP/HTTPS URL or domain name to analyse."
        ),
        examples=[
            "https://github.com",
            "https://google.com",
        ],
    )

    @field_validator("url")
    @classmethod
    def validate_url(
        cls,
        value: str,
    ) -> str:
        """
        Validate a submitted public HTTP or HTTPS URL.

        The user may omit the protocol. Final canonical normalization is
        performed by the prediction layer.
        """

        cleaned = str(
            value or ""
        ).strip()

        if not cleaned:
            raise ValueError(
                "URL cannot be empty."
            )

        if len(cleaned) > 2048:
            raise ValueError(
                "URL exceeds the maximum supported length of 2048 characters."
            )

        candidate = (
            cleaned
            if "://" in cleaned
            else f"https://{cleaned}"
        )

        try:
            parsed = urlsplit(
                candidate
            )

        except ValueError as error:
            raise ValueError(
                "URL could not be parsed."
            ) from error

        scheme = (
            parsed.scheme
            .strip()
            .lower()
        )

        if scheme not in {
            "http",
            "https",
        }:
            raise ValueError(
                "Only HTTP and HTTPS URLs are supported."
            )

        hostname = (
            parsed.hostname
            or ""
        ).strip().lower()

        if not hostname:
            raise ValueError(
                "URL must contain a valid hostname."
            )

        if any(
            character.isspace()
            for character in hostname
        ):
            raise ValueError(
                "URL hostname cannot contain spaces."
            )

        if hostname in {
            "string",
            "example",
            "localhost",
        }:
            raise ValueError(
                "Enter a real public domain instead of a placeholder."
            )

        try:
            parsed_port = parsed.port

        except ValueError as error:
            raise ValueError(
                "URL contains an invalid port."
            ) from error

        if parsed_port is not None and not (
            1 <= parsed_port <= 65535
        ):
            raise ValueError(
                "URL port must be between 1 and 65535."
            )

        # Accept public IP addresses.
        try:
            address = ipaddress.ip_address(
                hostname
            )

            if (
                address.is_private
                or address.is_loopback
                or address.is_link_local
                or address.is_multicast
                or address.is_reserved
                or address.is_unspecified
            ):
                raise ValueError(
                    "Private, local, reserved, and non-public IP addresses "
                    "are not supported."
                )

            return cleaned

        except ValueError as error:
            # Preserve the explicit non-public-IP rejection above.
            if (
                "Private, local, reserved"
                in str(error)
            ):
                raise

        # Validate domain labels.
        labels = hostname.split(".")

        if len(labels) < 2:
            raise ValueError(
                "Enter a valid public domain or IP address."
            )

        if len(hostname) > 253:
            raise ValueError(
                "Hostname exceeds the supported maximum length."
            )

        for label in labels:
            if not label:
                raise ValueError(
                    "URL contains an invalid empty hostname label."
                )

            if len(label) > 63:
                raise ValueError(
                    "A hostname label exceeds 63 characters."
                )

            if (
                label.startswith("-")
                or label.endswith("-")
            ):
                raise ValueError(
                    "Hostname labels cannot begin or end with a hyphen."
                )

            if not all(
                character.isalnum()
                or character == "-"
                for character in label
            ):
                raise ValueError(
                    "URL contains invalid hostname characters."
                )

        return cleaned


# ============================================================================
# Threat-intelligence schemas
# ============================================================================

class VirusTotalResult(ResponseModel):
    """
    VirusTotal result returned by the threat-intelligence engine.
    """

    virustotal_available: int = Field(
        default=0,
        ge=0,
        le=1,
        description=(
            "Whether VirusTotal data was available."
        ),
    )

    vt_malicious_votes: int = Field(
        default=0,
        ge=0,
        description=(
            "Number of engines that marked the URL as malicious."
        ),
    )

    vt_suspicious_votes: int = Field(
        default=0,
        ge=0,
        description=(
            "Number of engines that marked the URL as suspicious."
        ),
    )

    vt_detection_ratio: float = Field(
        default=0.0,
        ge=0,
        le=1,
        description=(
            "Ratio of malicious or suspicious VirusTotal detections."
        ),
    )


class SafeBrowsingResult(ResponseModel):
    """
    Google Safe Browsing result.
    """

    safe_browsing_available: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    malware_detected: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    social_engineering_detected: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    unwanted_software_detected: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    threat_types_count: int = Field(
        default=0,
        ge=0,
    )


class PhishTankResult(ResponseModel):
    """
    PhishTank lookup result.
    """

    phishtank_available: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    phishtank_listed: int = Field(
        default=0,
        ge=0,
        le=1,
    )


class ThreatIntelligenceSummary(ResponseModel):
    """
    Aggregated threat-intelligence status.
    """

    sources_checked: int = Field(
        default=0,
        ge=0,
    )

    threat_sources_detected: int = Field(
        default=0,
        ge=0,
    )

    is_known_threat: int = Field(
        default=0,
        ge=0,
        le=1,
    )


class ThreatIntelligenceResponse(ResponseModel):
    """
    Complete threat-intelligence response.
    """

    virustotal: VirusTotalResult = Field(
        default_factory=VirusTotalResult
    )

    safe_browsing: SafeBrowsingResult = Field(
        default_factory=SafeBrowsingResult
    )

    phishtank: PhishTankResult = Field(
        default_factory=PhishTankResult
    )

    summary: ThreatIntelligenceSummary = Field(
        default_factory=ThreatIntelligenceSummary
    )


# ============================================================================
# URL scan response
# ============================================================================

class URLScanResponse(ResponseModel):
    """
    Complete response returned by POST /scan.
    """

    model_config = ConfigDict(
        from_attributes=True,
        extra="ignore",
        json_schema_extra={
            "example": {
                "scan_id": (
                    "edbb6215-2fce-44a9-902c-426b664ce6a9"
                ),
                "scan_time": (
                    "2026-08-02T14:43:09.585561Z"
                ),
                "url": "https://github.com/",
                "raw_ml_prediction": "0",
                "ml_prediction": "LEGITIMATE",
                "prediction": "LEGITIMATE",
                "confidence": 99.78,
                "risk_score": 0.0,
                "severity": "LOW",
                "reasons": [
                    (
                        "Machine learning model found no major "
                        "phishing indicators"
                    ),
                    "Valid SSL certificate detected",
                    (
                        "Trusted domain reputation was detected"
                    ),
                ],
                "threat_intelligence": {
                    "virustotal": {
                        "virustotal_available": 0,
                        "vt_malicious_votes": 0,
                        "vt_suspicious_votes": 0,
                        "vt_detection_ratio": 0.0,
                    },
                    "safe_browsing": {
                        "safe_browsing_available": 0,
                        "malware_detected": 0,
                        "social_engineering_detected": 0,
                        "unwanted_software_detected": 0,
                        "threat_types_count": 0,
                    },
                    "phishtank": {
                        "phishtank_available": 1,
                        "phishtank_listed": 0,
                    },
                    "summary": {
                        "sources_checked": 3,
                        "threat_sources_detected": 0,
                        "is_known_threat": 0,
                    },
                },
            }
        },
    )

    scan_id: str = Field(
        ...,
        min_length=36,
        max_length=36,
        description=(
            "Unique UUID assigned to the scan."
        ),
    )

    scan_time: datetime = Field(
        ...,
        description=(
            "UTC timestamp at which the scan was performed."
        ),
    )

    url: str = Field(
        ...,
        min_length=3,
        max_length=2048,
        description=(
            "Normalized URL that was analysed."
        ),
    )

    raw_ml_prediction: str | None = Field(
        default=None,
        description=(
            "Original model class before mapping to a readable label."
        ),
    )

    ml_prediction: MLPredictionLabel | None = Field(
        default=None,
        description=(
            "Prediction returned directly by the machine-learning model."
        ),
    )

    prediction: PredictionLabel = Field(
        ...,
        description=(
            "Final SOC verdict after risk and threat-intelligence fusion."
        ),
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=100,
        description=(
            "Probability assigned to the predicted machine-learning class."
        ),
    )

    risk_score: float = Field(
        ...,
        ge=0,
        le=100,
        description=(
            "Final fused security risk score."
        ),
    )

    severity: SeverityLabel = Field(
        ...,
        description=(
            "Severity classification derived from the final risk score."
        ),
    )

    reasons: list[str] = Field(
        default_factory=list,
        description=(
            "Detection evidence and explanations generated by the backend."
        ),
    )

    threat_intelligence: ThreatIntelligenceResponse = Field(
        default_factory=ThreatIntelligenceResponse
    )

    @field_validator("reasons")
    @classmethod
    def clean_reasons(
        cls,
        values: list[str],
    ) -> list[str]:
        """
        Remove empty and exact duplicate reason strings.
        """

        cleaned_reasons: list[str] = []
        seen: set[str] = set()

        for reason in values:
            text = " ".join(
                str(reason or "").split()
            )

            if not text:
                continue

            normalized = text.casefold()

            if normalized in seen:
                continue

            seen.add(
                normalized
            )

            cleaned_reasons.append(
                text
            )

        return cleaned_reasons


# ============================================================================
# Scan details and history schemas
# ============================================================================

class ScanHistoryItem(ResponseModel):
    """
    A scan stored in the scan-history database.
    """

    id: int | None = Field(
        default=None,
        ge=1,
    )

    scan_id: str

    scan_time: datetime

    url: str

    raw_ml_prediction: str | None = None

    ml_prediction: MLPredictionLabel | None = None

    prediction: PredictionLabel

    confidence: float = Field(
        ge=0,
        le=100,
    )

    risk_score: float = Field(
        ge=0,
        le=100,
    )

    severity: SeverityLabel

    reasons: list[str] = Field(
        default_factory=list
    )

    threat_intelligence: ThreatIntelligenceResponse = Field(
        default_factory=ThreatIntelligenceResponse
    )

    created_at: datetime | None = None


class ScanDetailsResponse(ScanHistoryItem):
    """
    Detailed response returned by GET /scan/{scan_id}.
    """


class HistoryResponse(ResponseModel):
    """
    Response returned by GET /history.
    """

    total: int = Field(
        default=0,
        ge=0,
    )

    limit: int = Field(
        default=50,
        ge=1,
        le=200,
    )

    scans: list[ScanHistoryItem] = Field(
        default_factory=list
    )


# ============================================================================
# General API response schemas
# ============================================================================

class HealthResponse(ResponseModel):
    """
    Response returned by GET /health.
    """

    status: str

    service: str

    version: str

    timestamp: datetime


class MessageResponse(ResponseModel):
    """
    Generic message response.
    """

    message: str


class DeleteScanResponse(ResponseModel):
    """
    Response returned after deleting a scan.
    """

    message: str

    scan_id: str


class StatisticsResponse(ResponseModel):
    """
    Overall scan statistics.
    """

    total_scans: int = Field(
        default=0,
        ge=0,
    )

    phishing_detected: int = Field(
        default=0,
        ge=0,
    )

    suspicious_detected: int = Field(
        default=0,
        ge=0,
    )

    legitimate_detected: int = Field(
        default=0,
        ge=0,
    )

    average_risk_score: float = Field(
        default=0.0,
        ge=0,
        le=100,
    )


# ============================================================================
# Dashboard analytics schemas
# ============================================================================

class PredictionDistributionItem(ResponseModel):
    prediction: PredictionLabel
    count: int = Field(
        default=0,
        ge=0,
    )


class RiskDistributionItem(ResponseModel):
    range: str
    count: int = Field(
        default=0,
        ge=0,
    )


class TopDomainItem(ResponseModel):
    domain: str
    count: int = Field(
        default=0,
        ge=0,
    )


class DailyScanItem(ResponseModel):
    date: str
    count: int = Field(
        default=0,
        ge=0,
    )


class DashboardResponse(ResponseModel):
    statistics: StatisticsResponse = Field(
        default_factory=StatisticsResponse
    )

    prediction_distribution: dict[
        PredictionLabel,
        int,
    ] = Field(
        default_factory=lambda: {
            "LEGITIMATE": 0,
            "SUSPICIOUS": 0,
            "PHISHING": 0,
        }
    )

    risk_distribution: dict[
        SeverityLabel,
        int,
    ] = Field(
        default_factory=lambda: {
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "CRITICAL": 0,
        }
    )

    top_domains: list[TopDomainItem] = Field(
        default_factory=list
    )

    daily_scans: list[DailyScanItem] = Field(
        default_factory=list
    )

    recent_scans: list[ScanHistoryItem] = Field(
        default_factory=list
    )