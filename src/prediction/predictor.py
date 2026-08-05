"""
Feature extraction
    ↓
Machine-learning prediction
    ↓
Domain reputation
    ↓
Threat intelligence
    ↓
Risk fusion
    ↓
Explanation generation
    ↓
Final SOC verdict
"""

from __future__ import annotations

import ipaddress
import math
from functools import lru_cache
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import pandas as pd
from joblib import load

from src.explanation_engine.explanation_generator import (
    generate_explanation,
)
from src.feature_engineering.feature_pipeline import (
    extract_all_features,
)
from src.feature_engineering.training_features import (
    extract_training_features,

)
from src.feature_engineering.feature_schema import (
    ALL_FEATURES,
)
from src.risk_engine.risk_calculator import (
    calculate_risk,
)
from src.threat_intelligence.domain_reputation import (
    check_domain_reputation,
)
from src.threat_intelligence.threat_analyzer import (
    analyze_threat,
)
from src.utils.config import MODEL_DIR
from src.utils.logger import (
    error_logger,
    log_scan,
    security_logger,
)


# ============================================================================
# Model configuration
# ============================================================================

MODEL_PATH = MODEL_DIR / "RandomForest.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.pkl"


# ============================================================================
# Final risk boundaries
#
# Must remain consistent with:
# - risk_calculator.py
# - analytics_crud.py
# - frontend risk badges
# ============================================================================

LOW_MAX = 25.0
MEDIUM_MAX = 50.0
HIGH_MAX = 75.0
FEATURE_ORDER = list(ALL_FEATURES)


# ============================================================================
# Feature contract
#
# This order must exactly match the training and preprocessing pipeline.
# ============================================================================


# ============================================================================
# Generic conversion helpers
# ============================================================================

def to_int(
    value: Any,
    default: int = 0,
) -> int:
    """
    Convert a value to int without raising an exception.
    """

    try:
        return int(value)

    except (
        TypeError,
        ValueError,
        OverflowError,
    ):
        return default


def to_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Convert a value to float without raising an exception.
    """

    try:
        number = float(value)

        if not math.isfinite(number):
            return default

        return number

    except (
        TypeError,
        ValueError,
        OverflowError,
    ):
        return default


def to_flag(value: Any) -> int:
    """
    Convert truthy or numeric values into a strict 0/1 integer.
    """

    if isinstance(value, bool):
        return int(value)

    return int(
        to_float(value) > 0
    )


def clamp_percentage(
    value: Any,
) -> float:
    """
    Clamp a numeric value between 0 and 100.
    """

    number = to_float(value)

    return round(
        min(
            100.0,
            max(0.0, number),
        ),
        2,
    )


# ============================================================================
# URL normalization and validation
# ============================================================================

def normalize_url(
    url: str,
) -> str:
    """
    Normalize and validate a user-supplied HTTP or HTTPS URL.

    Examples:

        google.com
            -> https://google.com/

        https://example.com/login
            -> https://example.com/login
    """

    raw_url = str(
        url or ""
    ).strip()

    if not raw_url:
        raise ValueError(
            "URL cannot be empty."
        )

    if len(raw_url) > 2048:
        raise ValueError(
            "URL exceeds the maximum supported length of 2048 characters."
        )

    if "://" not in raw_url:
        raw_url = (
            f"https://{raw_url}"
        )

    parsed = urlsplit(
        raw_url
    )

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
            "Enter a real public domain instead of a placeholder hostname."
        )

    try:
        parsed_port = parsed.port

    except ValueError as error:
        raise ValueError(
            "URL contains an invalid port."
        ) from error

    is_ip_address = False

    try:
        ipaddress.ip_address(
            hostname
        )

        is_ip_address = True

    except ValueError:
        labels = hostname.split(
            "."
        )

        if (
            len(labels) < 2
            or not labels[-1]
        ):
            raise ValueError(
                "Enter a valid public domain or IP address."
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

    if ":" in hostname and is_ip_address:
        normalized_hostname = (
            f"[{hostname}]"
        )

    else:
        normalized_hostname = hostname

    netloc = normalized_hostname

    if parsed_port is not None:
        netloc = (
            f"{normalized_hostname}:"
            f"{parsed_port}"
        )

    normalized_url = urlunsplit(
        (
            scheme,
            netloc,
            parsed.path or "/",
            parsed.query,
            "",
        )
    )

    return normalized_url


# ============================================================================
# Reason cleanup
# ============================================================================

def get_reason_category(
    reason: str,
) -> str:
    """
    Group semantically similar explanation messages into one category.
    """

    normalized = (
        reason.lower()
        .replace("-", " ")
        .replace("_", " ")
        .replace(".", "")
    )

    normalized = " ".join(
        normalized.split()
    )

    if (
        "machine learning" in normalized
        and "phishing" in normalized
    ):
        return "ml_phishing"

    if (
        "machine learning" in normalized
        and (
            "legitimate" in normalized
            or "no major phishing" in normalized
        )
    ):
        return "ml_legitimate"

    if (
        "valid ssl certificate" in normalized
        or "ssl certificate was detected" in normalized
    ):
        return "ssl_valid"

    if (
        "invalid ssl" in normalized
        or "ssl certificate could not be validated" in normalized
        or "ssl certificate validation failed" in normalized
    ):
        return "ssl_invalid"

    if "trusted domain" in normalized:
        return "trusted_domain"

    if (
        "domain reputation" in normalized
        and "malicious" in normalized
    ):
        return "malicious_reputation"

    if "path length" in normalized:
        return "path_length"

    if "url length" in normalized:
        return "url_length"

    if (
        "num dots" in normalized
        or "number of dots" in normalized
    ):
        return "num_dots"

    if (
        "suspicious keyword" in normalized
        or "suspicious keywords" in normalized
    ):
        return "suspicious_keywords"

    if "brand related" in normalized:
        return "brand_keywords"

    if (
        "high url randomness" in normalized
        or "moderate url randomness" in normalized
    ):
        return "url_entropy"

    if (
        "ip address instead of" in normalized
        or "url uses ip address" in normalized
    ):
        return "ip_address"

    if "virus total" in normalized or "virustotal" in normalized:
        return f"virustotal:{normalized}"

    if "safe browsing" in normalized:
        return f"safe_browsing:{normalized}"

    if "phishtank" in normalized:
        return "phishtank"

    if "dns record" in normalized:
        return "dns"

    if "domain was registered" in normalized:
        return "domain_age"

    return normalized


def deduplicate_reasons(
    reasons: list[Any],
) -> list[str]:
    """
    Remove empty, exact and semantically repeated reasons.

    The original order is preserved.
    """

    cleaned: list[str] = []
    seen_categories: set[str] = set()

    for reason in reasons:
        text = " ".join(
            str(reason or "").split()
        )

        if not text:
            continue

        category = get_reason_category(
            text
        )

        if category in seen_categories:
            continue

        seen_categories.add(
            category
        )

        cleaned.append(
            text
        )

    return cleaned


# ============================================================================
# Threat-intelligence defaults and normalization
# ============================================================================

def empty_threat_intelligence() -> dict[str, Any]:
    """
    Return a complete neutral threat-intelligence response.
    """

    return {
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
            "phishtank_available": 0,
            "phishtank_listed": 0,
        },
        "summary": {
            "sources_checked": 0,
            "threat_sources_detected": 0,
            "is_known_threat": 0,
        },
    }


def normalize_threat_intelligence(
    result: Any,
) -> dict[str, Any]:
    """
    Enforce provider-specific threat-intelligence schemas.

    This prevents provider data from leaking into the wrong sections.
    """

    source = (
        result
        if isinstance(
            result,
            dict,
        )
        else {}
    )

    virus_total_source = source.get(
        "virustotal"
    )

    safe_browsing_source = source.get(
        "safe_browsing"
    )

    phish_tank_source = source.get(
        "phishtank"
    )

    summary_source = source.get(
        "summary"
    )

    virus_total = (
        virus_total_source
        if isinstance(
            virus_total_source,
            dict,
        )
        else {}
    )

    safe_browsing = (
        safe_browsing_source
        if isinstance(
            safe_browsing_source,
            dict,
        )
        else {}
    )

    phish_tank = (
        phish_tank_source
        if isinstance(
            phish_tank_source,
            dict,
        )
        else {}
    )

    summary = (
        summary_source
        if isinstance(
            summary_source,
            dict,
        )
        else {}
    )

    normalized: dict[str, Any] = {
        "virustotal": {
            "virustotal_available": to_flag(
                virus_total.get(
                    "virustotal_available"
                )
            ),
            "vt_malicious_votes": max(
                0,
                to_int(
                    virus_total.get(
                        "vt_malicious_votes"
                    )
                ),
            ),
            "vt_suspicious_votes": max(
                0,
                to_int(
                    virus_total.get(
                        "vt_suspicious_votes"
                    )
                ),
            ),
            "vt_detection_ratio": max(
                0.0,
                to_float(
                    virus_total.get(
                        "vt_detection_ratio"
                    )
                ),
            ),
        },
        "safe_browsing": {
            "safe_browsing_available": to_flag(
                safe_browsing.get(
                    "safe_browsing_available"
                )
            ),
            "malware_detected": to_flag(
                safe_browsing.get(
                    "malware_detected"
                )
            ),
            "social_engineering_detected": to_flag(
                safe_browsing.get(
                    "social_engineering_detected"
                )
            ),
            "unwanted_software_detected": to_flag(
                safe_browsing.get(
                    "unwanted_software_detected"
                )
            ),
            "threat_types_count": max(
                0,
                to_int(
                    safe_browsing.get(
                        "threat_types_count"
                    )
                ),
            ),
        },
        "phishtank": {
            "phishtank_available": to_flag(
                phish_tank.get(
                    "phishtank_available"
                )
            ),
            "phishtank_listed": to_flag(
                phish_tank.get(
                    "phishtank_listed"
                )
            ),
        },
        "summary": {
            "sources_checked": max(
                0,
                to_int(
                    summary.get(
                        "sources_checked"
                    )
                ),
            ),
            "threat_sources_detected": max(
                0,
                to_int(
                    summary.get(
                        "threat_sources_detected"
                    )
                ),
            ),
            "is_known_threat": to_flag(
                summary.get(
                    "is_known_threat"
                )
            ),
        },
    }

    available_sources = sum(
        [
            normalized["virustotal"][
                "virustotal_available"
            ],
            normalized["safe_browsing"][
                "safe_browsing_available"
            ],
            normalized["phishtank"][
                "phishtank_available"
            ],
        ]
    )

    detected_sources = sum(
        [
            int(
                normalized["virustotal"][
                    "vt_malicious_votes"
                ] > 0
                or normalized[
                    "virustotal"
                ][
                    "vt_suspicious_votes"
                ] > 0
            ),
            int(
                normalized["safe_browsing"][
                    "malware_detected"
                ] > 0
                or normalized[
                    "safe_browsing"
                ][
                    "social_engineering_detected"
                ] > 0
                or normalized[
                    "safe_browsing"
                ][
                    "unwanted_software_detected"
                ] > 0
            ),
            int(
                normalized["phishtank"][
                    "phishtank_listed"
                ] > 0
            ),
        ]
    )

    if (
        normalized["summary"][
            "sources_checked"
        ]
        <= 0
    ):
        normalized["summary"][
            "sources_checked"
        ] = available_sources

    if (
        normalized["summary"][
            "threat_sources_detected"
        ]
        <= 0
    ):
        normalized["summary"][
            "threat_sources_detected"
        ] = detected_sources

    normalized["summary"][
        "is_known_threat"
    ] = int(
        normalized["summary"][
            "is_known_threat"
        ] > 0
        or detected_sources > 0
    )

    return normalized


def safe_threat_analysis(
    url: str,
) -> dict[str, Any]:
    """
    Run threat-intelligence checks without allowing provider failures
    to crash the scan.
    """

    try:
        result = analyze_threat(
            url
        )

        return (
            normalize_threat_intelligence(
                result
            )
        )

    except Exception:
        security_logger.exception(
            (
                "Threat intelligence unavailable "
                "| url=%s"
            ),
            url,
        )

        return (
            empty_threat_intelligence()
        )


# ============================================================================
# Domain reputation wrapper
# ============================================================================

def safe_domain_reputation(
    url: str,
) -> dict[str, Any]:
    """
    Run domain-reputation analysis without crashing the main pipeline.
    """

    try:
        result = check_domain_reputation(
            url
        )

        if isinstance(
            result,
            dict,
        ):
            return dict(result)

    except Exception:
        security_logger.exception(
            (
                "Domain reputation unavailable "
                "| url=%s"
            ),
            url,
        )

    return {}


# ============================================================================
# Model loading
# ============================================================================

@lru_cache(maxsize=1)
def load_components() -> tuple[Any, Any]:
    """
    Load the ML model and preprocessor once per Python process.
    """

    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}"
            )

        if not PREPROCESSOR_PATH.exists():
            raise FileNotFoundError(
                (
                    "Preprocessor file not found: "
                    f"{PREPROCESSOR_PATH}"
                )
            )

        model = load(
            MODEL_PATH
        )

        preprocessor = load(
            PREPROCESSOR_PATH
        )

        expected_features = list(
            getattr(
                preprocessor,
                "feature_names_in_",
                [],
            )
        )

        if expected_features:
            if expected_features != FEATURE_ORDER:
                raise RuntimeError(
                    "Training and prediction feature schemas do not match. "
                    f"Preprocessor expects: {expected_features}; "
                    f"predictor provides: {FEATURE_ORDER}"
                )

        if not hasattr(
            model,
            "predict",
        ):
            raise TypeError(
                "Loaded model does not provide predict()."
            )

        if not hasattr(
            preprocessor,
            "transform",
        ):
            raise TypeError(
                "Loaded preprocessor does not provide transform()."
            )

        security_logger.info(
            "ML model and preprocessor loaded successfully"
        )

        return (
            model,
            preprocessor,
        )

    except Exception as error:
        error_logger.exception(
            "Model component loading failed"
        )

        raise RuntimeError(
            "Unable to load SentinelScan ML components."
        ) from error


# ============================================================================
# Feature preparation
# ============================================================================

def normalize_feature_value(
    value: Any,
) -> int | float:
    """
    Normalize feature values before passing them into the saved preprocessor.
    """

    if value is None:
        return 0

    if isinstance(
        value,
        bool,
    ):
        return int(value)

    if isinstance(
        value,
        (int, float),
    ):
        number = to_float(
            value
        )

        return number

    converted = to_float(
        value,
        default=0.0,
    )

    return converted


def prepare_features(
    features: dict[str, Any],
) -> pd.DataFrame:
    """
    Convert extracted features into the exact feature order expected by
    the saved training pipeline.
    """

    if not isinstance(
        features,
        dict,
    ):
        raise TypeError(
            "Feature extraction returned an invalid response."
        )

    prepared = {
        column: normalize_feature_value(
            features.get(
                column,
                0,
            )
        )
        for column in FEATURE_ORDER
    }

    dataframe = pd.DataFrame(
        [prepared],
        columns=FEATURE_ORDER,
    )

    dataframe = dataframe.replace(
        [
            float("inf"),
            float("-inf"),
        ],
        0,
    )

    dataframe = dataframe.fillna(
        0
    )

    unexpected_columns = set(
        dataframe.columns
    ) - set(
        FEATURE_ORDER
    )

    if unexpected_columns:
        security_logger.warning(
            (
                "Unexpected prepared feature columns "
                "were detected: %s"
            ),
            sorted(
                unexpected_columns
            ),
        )

    return dataframe


# ============================================================================
# Model prediction helpers
# ============================================================================

def map_model_prediction(
    prediction: Any,
) -> str:
    """
    Map supported raw model classes to SentinelScan labels.

    The mapping must match the model's training labels.
    """

    normalized = str(
        prediction
    ).strip().upper()

    phishing_values = {
        "1",
        "PHISHING",
        "MALICIOUS",
        "TRUE",
    }

    legitimate_values = {
        "0",
        "-1",
        "LEGITIMATE",
        "BENIGN",
        "SAFE",
        "FALSE",
    }

    if normalized in phishing_values:
        return "PHISHING"

    if normalized in legitimate_values:
        return "LEGITIMATE"

    raise ValueError(
        (
            "Unsupported model prediction class: "
            f"{prediction!r}"
        )
    )


def calculate_model_confidence(
    model: Any,
    transformed_features: Any,
    predicted_class: Any,
) -> float:
    """
    Return the probability assigned to the predicted model class.
    """

    if not hasattr(
        model,
        "predict_proba",
    ):
        security_logger.warning(
            (
                "Loaded model does not provide predict_proba(); "
                "confidence will be returned as 0."
            )
        )

        return 0.0

    probabilities = model.predict_proba(
        transformed_features
    )[0]

    if len(probabilities) == 0:
        return 0.0

    classes = list(
        getattr(
            model,
            "classes_",
            [],
        )
    )

    try:
        class_index = classes.index(
            predicted_class
        )

    except ValueError:
        class_index = int(
            probabilities.argmax()
        )

    probability = to_float(
        probabilities[
            class_index
        ]
    )

    return clamp_percentage(
        probability * 100
    )


# ============================================================================
# Final decision helpers
# ============================================================================

def classify_severity(
    risk_score: float,
) -> str:
    """
    Classify risk using the same boundaries as the analytics layer.
    """

    if risk_score > HIGH_MAX:
        return "CRITICAL"

    if risk_score > MEDIUM_MAX:
        return "HIGH"

    if risk_score > LOW_MAX:
        return "MEDIUM"

    return "LOW"


def get_final_prediction(
    risk_score: float,
) -> str:
    """
    Convert the fused risk score into the final SOC verdict.

    0–25:
        LEGITIMATE

    26–75:
        SUSPICIOUS

    76–100:
        PHISHING
    """

    if risk_score > HIGH_MAX:
        return "PHISHING"

    if risk_score > LOW_MAX:
        return "SUSPICIOUS"

    return "LEGITIMATE"


def normalize_risk_result(
    risk_result: Any,
) -> dict[str, Any]:
    """
    Validate and normalize the result returned by the risk engine.
    """

    if not isinstance(
        risk_result,
        dict,
    ):
        raise RuntimeError(
            "Risk engine returned an invalid response."
        )

    risk_score = clamp_percentage(
        risk_result.get(
            "risk_score",
            0,
        )
    )

    calculated_severity = (
        classify_severity(
            risk_score
        )
    )

    supplied_severity = str(
        risk_result.get(
            "severity",
            "",
        )
    ).strip().upper()

    if (
        supplied_severity
        and supplied_severity
        != calculated_severity
    ):
        security_logger.warning(
            (
                "Risk engine severity mismatch | "
                "supplied=%s | calculated=%s | risk_score=%s"
            ),
            supplied_severity,
            calculated_severity,
            risk_score,
        )

    raw_reasons = risk_result.get(
        "reasons",
        [],
    )

    reasons = (
        list(raw_reasons)
        if isinstance(
            raw_reasons,
            (list, tuple),
        )
        else []
    )

    return {
        "risk_score": risk_score,
        "severity": calculated_severity,
        "reasons": reasons,
    }


# ============================================================================
# Main prediction function
# ============================================================================

def predict_url(
    url: str,
) -> dict[str, Any]:
    """
    Run the complete SentinelScan phishing-detection pipeline.

    This function returns analysis data only.

    API metadata such as:
    - scan_id
    - scan_time

    is added by the route layer.
    """

    normalized_url = normalize_url(
        url
    )

    security_logger.info(
        (
            "Prediction started | "
            "url=%s"
        ),
        normalized_url,
    )

    try:
        model, preprocessor = (
            load_components()
        )

        # --------------------------------------------------------------------
        # Feature extraction
        # --------------------------------------------------------------------

        # Use the exact same feature-generation method used during training.
        # This prevents training-inference distribution mismatch.
        ml_features_result = extract_training_features(
            normalized_url
        )

        if not isinstance(
            ml_features_result,
            dict,
        ):
            raise RuntimeError(
                "ML feature extraction returned an invalid response."
            )

        ml_features = dict(
            ml_features_result
        )

        # Extract real DNS, WHOIS and SSL features separately.
        # These are used by the risk engine, not directly by the trained model.
        live_features_result = extract_all_features(
            normalized_url
        )

        if not isinstance(
            live_features_result,
            dict,
        ):
            security_logger.warning(
                "Live feature extraction returned an invalid response | url=%s",
                normalized_url,
            )

            live_features = dict(
                ml_features
            )

        else:
            live_features = dict(
                live_features_result
            )

        features = live_features

        # The model must receive the exact training feature distribution.
        dataframe = prepare_features(
            ml_features
        )

        transformed_features = (
            preprocessor.transform(
                dataframe
            )
        )

        # --------------------------------------------------------------------
        # Raw ML prediction
        # --------------------------------------------------------------------

        raw_prediction = model.predict(
            transformed_features
        )[0]

        ml_prediction = (
            map_model_prediction(
                raw_prediction
            )
        )

        confidence = (
            calculate_model_confidence(
                model,
                transformed_features,
                raw_prediction,
            )
        )

        # --------------------------------------------------------------------
        # Domain reputation
        # --------------------------------------------------------------------

        reputation = (
            safe_domain_reputation(
                normalized_url
            )
        )

        # --------------------------------------------------------------------
        # Threat intelligence
        # --------------------------------------------------------------------

        threat_intelligence = (
            safe_threat_analysis(
                normalized_url
            )
        )

        # --------------------------------------------------------------------
        # Risk fusion
        # --------------------------------------------------------------------

        raw_risk_result = (
            calculate_risk(
                ml_prediction,
                confidence,
                features,
                threat_intelligence,
                reputation,
            )
        )

        risk_result = (
            normalize_risk_result(
                raw_risk_result
            )
        )

        risk_score = (
            risk_result[
                "risk_score"
            ]
        )

        severity = (
            risk_result[
                "severity"
            ]
        )

        # --------------------------------------------------------------------
        # Explanation generation
        # --------------------------------------------------------------------

        explanation_result = (
            generate_explanation(
                ml_prediction,
                features,
            )
        )

        explanation_reasons = (
            list(
                explanation_result
            )
            if isinstance(
                explanation_result,
                (list, tuple),
            )
            else []
        )

        risk_reasons = (
            risk_result[
                "reasons"
            ]
        )

        all_reasons = (
            explanation_reasons
            + risk_reasons
        )

        reasons = deduplicate_reasons(
            all_reasons
        )

        # --------------------------------------------------------------------
        # Final SOC verdict
        # --------------------------------------------------------------------

        final_prediction = (
            get_final_prediction(
                risk_score
            )
        )

        result = {
            "url": normalized_url,

            # Original model class for technical debugging.
            "raw_ml_prediction": str(
                raw_prediction
            ),

            # Human-readable ML-only result.
            "ml_prediction": (
                ml_prediction
            ),

            # Fused SOC result.
            "prediction": (
                final_prediction
            ),

            "confidence": (
                confidence
            ),

            "risk_score": (
                risk_score
            ),

            "severity": (
                severity
            ),

            "reasons": (
                reasons
            ),

            "threat_intelligence": (
                threat_intelligence
            ),
        }

        log_scan(
            normalized_url,
            final_prediction,
            risk_score,
            severity,
        )

        security_logger.info(
            (
                "Prediction completed | "
                "url=%s | "
                "raw_prediction=%s | "
                "ml_prediction=%s | "
                "final_prediction=%s | "
                "confidence=%s | "
                "risk_score=%s | "
                "severity=%s"
            ),
            normalized_url,
            raw_prediction,
            ml_prediction,
            final_prediction,
            confidence,
            risk_score,
            severity,
        )

        return result

    except Exception:
        error_logger.exception(
            (
                "Prediction failed | "
                "url=%s"
            ),
            normalized_url,
        )

        # Do not return a fake prediction="ERROR" result.
        # The API route should return an HTTP 500 and avoid saving the scan.
        raise


# ============================================================================
# Optional local test
# ============================================================================

if __name__ == "__main__":
    test_urls = [
        "https://google.com",
        "paypal-login-security-check.com",
        "http://192.168.1.1/login",
    ]

    for test_url in test_urls:
        print(
            "\n"
            + "=" * 72
        )

        print(
            f"Testing: {test_url}"
        )

        try:
            result = predict_url(
                test_url
            )

            print(
                result
            )

        except Exception as error:
            print(
                {
                    "url": test_url,
                    "error": str(error),
                }
            )