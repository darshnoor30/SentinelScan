"""
SentinelScan SOC Risk Fusion Engine
-----------------------------------

Combines:

- Machine-learning prediction
- Confidence calibration
- URL behaviour analysis
- SSL intelligence
- Threat-intelligence feeds
- Domain reputation

Produces:

- Risk score from 0 to 100
- Severity classification
- Explainable security reasons
"""

from __future__ import annotations

from typing import Any


# ============================================================================
# Shared risk boundaries
# ============================================================================

LOW_MAX = 25
MEDIUM_MAX = 50
HIGH_MAX = 75


def to_int(
    value: Any,
    default: int = 0,
) -> int:
    """
    Convert a value to an integer without raising an exception.
    """

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def to_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Convert a value to a float without raising an exception.
    """

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp_score(value: Any) -> float:
    """
    Clamp a risk score between 0 and 100.
    """

    score = to_float(value)

    return round(
        min(100.0, max(0.0, score)),
        2,
    )


def deduplicate_reasons(
    reasons: list[Any],
) -> list[str]:
    """
    Remove empty and duplicate reasons while preserving order.
    """

    cleaned: list[str] = []
    seen: set[str] = set()

    for reason in reasons:
        text = " ".join(
            str(reason or "").split()
        )

        if not text:
            continue

        normalized = text.lower()

        if normalized in seen:
            continue

        seen.add(normalized)
        cleaned.append(text)

    return cleaned


def classify_severity(
    risk_score: float,
) -> str:
    """
    Convert a risk score into the dashboard severity classes.

    LOW:       0–25
    MEDIUM:   26–50
    HIGH:     51–75
    CRITICAL: 76–100
    """

    if risk_score > HIGH_MAX:
        return "CRITICAL"

    if risk_score > MEDIUM_MAX:
        return "HIGH"

    if risk_score > LOW_MAX:
        return "MEDIUM"

    return "LOW"


# ============================================================================
# Threat-intelligence scoring
# ============================================================================

def calculate_threat_score(
    threat_intelligence: dict[str, Any] | None,
    reasons: list[str],
) -> float:
    """
    Convert external threat-intelligence signals into risk points.

    Strong verified threat feeds have greater influence than heuristic
    URL indicators.
    """

    if not isinstance(
        threat_intelligence,
        dict,
    ):
        return 0.0

    score = 0.0

    # ------------------------------------------------------------------------
    # VirusTotal
    # ------------------------------------------------------------------------

    virus_total = (
        threat_intelligence.get(
            "virustotal"
        )
    )

    virus_total = (
        virus_total
        if isinstance(
            virus_total,
            dict,
        )
        else {}
    )

    malicious_votes = max(
        0,
        to_int(
            virus_total.get(
                "vt_malicious_votes"
            )
        ),
    )

    suspicious_votes = max(
        0,
        to_int(
            virus_total.get(
                "vt_suspicious_votes"
            )
        ),
    )

    detection_ratio = max(
        0.0,
        to_float(
            virus_total.get(
                "vt_detection_ratio"
            )
        ),
    )

    if malicious_votes >= 5:
        score += 40

        reasons.append(
            "Multiple VirusTotal engines classified the URL as malicious"
        )

    elif malicious_votes > 0:
        score += 30

        reasons.append(
            "VirusTotal detected malicious activity"
        )

    elif suspicious_votes > 0:
        score += 15

        reasons.append(
            "VirusTotal reported suspicious activity"
        )

    if detection_ratio >= 0.20:
        score += 15

        reasons.append(
            "VirusTotal reported a high detection ratio"
        )

    elif detection_ratio >= 0.05:
        score += 5

        reasons.append(
            "VirusTotal reported a non-zero detection ratio"
        )

    # ------------------------------------------------------------------------
    # Google Safe Browsing
    # ------------------------------------------------------------------------

    safe_browsing = (
        threat_intelligence.get(
            "safe_browsing"
        )
    )

    safe_browsing = (
        safe_browsing
        if isinstance(
            safe_browsing,
            dict,
        )
        else {}
    )

    malware_detected = to_int(
        safe_browsing.get(
            "malware_detected"
        )
    ) > 0

    social_engineering_detected = (
        to_int(
            safe_browsing.get(
                "social_engineering_detected"
            )
        )
        > 0
    )

    unwanted_software_detected = (
        to_int(
            safe_browsing.get(
                "unwanted_software_detected"
            )
        )
        > 0
    )

    if malware_detected:
        score += 35

        reasons.append(
            "Google Safe Browsing detected malware"
        )

    if social_engineering_detected:
        score += 35

        reasons.append(
            "Google Safe Browsing detected social engineering"
        )

    if unwanted_software_detected:
        score += 20

        reasons.append(
            "Google Safe Browsing detected unwanted software"
        )

    # ------------------------------------------------------------------------
    # PhishTank
    # ------------------------------------------------------------------------

    phish_tank = (
        threat_intelligence.get(
            "phishtank"
        )
    )

    phish_tank = (
        phish_tank
        if isinstance(
            phish_tank,
            dict,
        )
        else {}
    )

    if (
        to_int(
            phish_tank.get(
                "phishtank_listed"
            )
        )
        > 0
    ):
        score += 45

        reasons.append(
            "URL is listed in the PhishTank phishing database"
        )

    return score


# ============================================================================
# URL behaviour scoring
# ============================================================================

def calculate_url_behaviour_score(
    features: dict[str, Any],
    reasons: list[str],
) -> float:
    """
    Score suspicious lexical and structural URL behaviour.
    """

    score = 0.0

    if to_int(
        features.get(
            "has_ip_address"
        )
    ):
        score += 18

        reasons.append(
            "URL uses an IP address instead of a domain name"
        )

    if to_int(
        features.get(
            "has_at_symbol"
        )
    ):
        score += 12

        reasons.append(
            "URL contains an @ symbol"
        )

    suspicious_keyword_count = max(
        0,
        to_int(
            features.get(
                "suspicious_keyword_count"
            )
        ),
    )

    if suspicious_keyword_count > 0:
        keyword_score = min(
            suspicious_keyword_count * 7,
            21,
        )

        score += keyword_score

        reasons.append(
            "Suspicious keywords were detected in the URL"
        )

    brand_keyword_count = max(
        0,
        to_int(
            features.get(
                "brand_keyword_count"
            )
        ),
    )

    if brand_keyword_count > 0:
        score += min(
            brand_keyword_count * 4,
            12,
        )

        reasons.append(
            "Brand-related terms were detected in the URL"
        )

    entropy = to_float(
        features.get(
            "entropy"
        )
    )

    if entropy >= 4.5:
        score += 12

        reasons.append(
            "High URL randomness was detected"
        )

    elif entropy >= 4.0:
        score += 6

        reasons.append(
            "Moderate URL randomness was detected"
        )

    num_subdomains = max(
        0,
        to_int(
            features.get(
                "num_subdomains"
            )
        ),
    )

    if num_subdomains >= 4:
        score += 10

        reasons.append(
            "The URL contains an unusually deep subdomain structure"
        )

    elif num_subdomains >= 3:
        score += 5

        reasons.append(
            "The URL contains multiple subdomains"
        )

    num_hyphens = max(
        0,
        to_int(
            features.get(
                "num_hyphens"
            )
        ),
    )

    if num_hyphens >= 4:
        score += 8

        reasons.append(
            "The domain contains an unusually high number of hyphens"
        )

    if to_int(
        features.get(
            "has_url_encoding"
        )
    ):
        score += 6

        reasons.append(
            "The URL contains encoded characters"
        )

    return score


# ============================================================================
# Main risk engine
# ============================================================================

def calculate_risk(
    prediction: str,
    confidence: float,
    features: dict[str, Any],
    threat_intelligence: dict[str, Any] | None = None,
    domain_reputation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Calculate the final fused security risk.

    The ML model contributes evidence, but the final score is also influenced
    by URL features, SSL, domain reputation and external threat feeds.
    """

    normalized_prediction = str(
        prediction or ""
    ).strip().upper()

    normalized_confidence = clamp_score(
        confidence
    )

    safe_features = (
        features
        if isinstance(features, dict)
        else {}
    )

    safe_reputation = (
        domain_reputation
        if isinstance(
            domain_reputation,
            dict,
        )
        else {}
    )

    reasons: list[str] = []
    risk_score = 0.0

    trusted_domain = (
        to_int(
            safe_reputation.get(
                "is_trusted_domain"
            )
        )
        > 0
    )

    known_malicious_domain = (
        to_int(
            safe_reputation.get(
                "is_malicious_domain"
            )
        )
        > 0
    )

    # ------------------------------------------------------------------------
    # ML prediction contribution
    # ------------------------------------------------------------------------

    if normalized_prediction == "PHISHING":
        if normalized_confidence >= 90:
            ml_score = 45.0

            reasons.append(
                "The machine-learning model detected phishing characteristics with high confidence"
            )

        elif normalized_confidence >= 75:
            ml_score = 35.0

            reasons.append(
                "The machine-learning model detected phishing characteristics"
            )

        elif normalized_confidence >= 60:
            ml_score = 25.0

            reasons.append(
                "The machine-learning model detected possible phishing characteristics"
            )

        else:
            ml_score = 15.0

            reasons.append(
                "The machine-learning model produced a low-confidence phishing signal"
            )

        if trusted_domain:
            ml_score *= 0.35

            reasons.append(
                "The ML phishing signal was reduced because the domain is trusted"
            )

        risk_score += ml_score

    elif normalized_prediction == "LEGITIMATE":
        if normalized_confidence >= 85:
            reasons.append(
                "The machine-learning model found no major phishing indicators"
            )

        elif normalized_confidence >= 60:
            risk_score += 5

            reasons.append(
                "The machine-learning model produced a moderate-confidence legitimate result"
            )

        else:
            risk_score += 12

            reasons.append(
                "The legitimate model classification has low confidence"
            )

    else:
        risk_score += 15

        reasons.append(
            "The machine-learning model returned an unknown classification"
        )

    # ------------------------------------------------------------------------
    # URL behaviour
    # ------------------------------------------------------------------------

    risk_score += calculate_url_behaviour_score(
        safe_features,
        reasons,
    )

    # ------------------------------------------------------------------------
    # SSL and certificate intelligence
    # ------------------------------------------------------------------------

    ssl_valid = to_int(
        safe_features.get(
            "ssl_valid",
            0,
        )
    )

    has_https = to_int(
        safe_features.get(
            "has_https",
            0,
        )
    )

    if not has_https:
        risk_score += 8

        reasons.append(
            "The URL does not use HTTPS"
        )

    if ssl_valid == 0:
        risk_score += 12

        reasons.append(
            "The SSL certificate could not be validated"
        )

    elif ssl_valid == 1:
        reasons.append(
            "A valid SSL certificate was detected"
        )

    certificate_expiry_days = to_int(
        safe_features.get(
            "certificate_expiry_days"
        )
    )

    if (
        ssl_valid == 1
        and certificate_expiry_days < 0
    ):
        risk_score += 15

        reasons.append(
            "The SSL certificate appears to be expired"
        )

    # ------------------------------------------------------------------------
    # DNS and domain-age intelligence
    # ------------------------------------------------------------------------

    dns_exists = to_int(
        safe_features.get(
            "dns_exists",
            0,
        )
    )

    if dns_exists == 0:
        risk_score += 12

        reasons.append(
            "No valid DNS record was detected"
        )

    domain_age_days = to_int(
        safe_features.get(
            "domain_age_days",
            0,
        )
    )

    has_whois_record = to_int(
        safe_features.get(
            "has_whois_record",
            0,
        )
    )

    if (
        has_whois_record == 1
        and 0 < domain_age_days < 30
    ):
        risk_score += 15

        reasons.append(
            "The domain was registered very recently"
        )

    elif (
        has_whois_record == 1
        and 30 <= domain_age_days < 180
    ):
        risk_score += 7

        reasons.append(
            "The domain has a relatively short registration history"
        )

    # ------------------------------------------------------------------------
    # Threat intelligence
    # ------------------------------------------------------------------------

    risk_score += calculate_threat_score(
        threat_intelligence,
        reasons,
    )

    # ------------------------------------------------------------------------
    # Domain reputation
    # ------------------------------------------------------------------------

    if known_malicious_domain:
        risk_score += 40

        reasons.append(
            "The domain reputation service marked the domain as malicious"
        )

    if trusted_domain:
        risk_score -= 20

        reasons.append(
            "Trusted domain reputation was detected"
        )

    # ------------------------------------------------------------------------
    # Normalize score and classify severity
    # ------------------------------------------------------------------------

    normalized_risk_score = clamp_score(
        risk_score
    )

    severity = classify_severity(
        normalized_risk_score
    )

    return {
        "risk_score": normalized_risk_score,
        "severity": severity,
        "reasons": deduplicate_reasons(
            reasons
        ),
    }