"""
SentinelScan Fast Training Feature Extractor
--------------------------------------------

Creates the exact feature schema used to train the current model.

External network calls are intentionally disabled so that large
training datasets can be processed quickly and reproducibly.
"""

from __future__ import annotations

from typing import Any

from src.feature_engineering.feature_schema import (
    ALL_FEATURES,
)
from src.feature_engineering.url_features import (
    extract_url_features,
)


NETWORK_FEATURE_DEFAULTS: dict[
    str,
    int | float,
] = {
    "domain_age_days": -1,
    "has_whois_record": 0,
    "registrar_known": 0,
    "is_free_domain": 0,
    "tld_risk_score": 0.0,
    "dns_exists": 0,
    "a_record_count": 0,
    "mx_record_exists": 0,
    "nameserver_count": 0,
    "ssl_valid": 0,
    "certificate_age_days": -1,
    "certificate_expiry_days": -1,
    "issuer_known": 0,
    "tls_version_score": 0,
}


def extract_training_features(
    url: Any,
) -> dict[str, int | float]:
    """
    Extract the exact training-time feature representation.
    """

    features = extract_url_features(
        url
    )

    features.update(
        NETWORK_FEATURE_DEFAULTS
    )

    missing_features = [
        feature
        for feature in ALL_FEATURES
        if feature not in features
    ]

    if missing_features:
        raise ValueError(
            "Missing training features: "
            f"{missing_features}"
        )

    unexpected_features = [
        feature
        for feature in features
        if feature not in ALL_FEATURES
    ]

    if unexpected_features:
        raise ValueError(
            "Unexpected training features: "
            f"{unexpected_features}"
        )

    # Return features in the canonical schema order.
    return {
        feature: features[feature]
        for feature in ALL_FEATURES
    }