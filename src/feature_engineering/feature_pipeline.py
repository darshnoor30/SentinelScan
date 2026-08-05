"""
SentinelScan

Unified Feature Extraction Pipeline

Combines:
- URL Intelligence
- Domain Intelligence
- DNS Intelligence
- SSL/TLS Intelligence
"""


from src.feature_engineering.url_features import (
    extract_url_features
)

from src.feature_engineering.domain_features import (
    extract_domain_features
)

from src.feature_engineering.dns_features import (
    extract_dns_features
)

from src.feature_engineering.ssl_features import (
    extract_ssl_features
)

from src.feature_engineering.feature_schema import (
    ALL_FEATURES
)

from src.utils.logger import get_logger


from src.utils.config import LOG_DIR


logger = get_logger(
    __name__,
    LOG_DIR / "feature_engineering.log"
)

def extract_all_features(url):

    """
    Extract complete SentinelScan feature vector.
    """

    features = {}


    # -------------------------
    # URL Features
    # -------------------------

    url_features = extract_url_features(
        url
    )

    features.update(
        url_features
    )


    # -------------------------
    # Domain Features
    # -------------------------

    domain_features = extract_domain_features(
        url
    )

    features.update(
        domain_features
    )


    # -------------------------
    # DNS Features
    # -------------------------

    dns_features = extract_dns_features(
        url
    )

    features.update(
        dns_features
    )


    # -------------------------
    # SSL Features
    # -------------------------

    ssl_features = extract_ssl_features(
        url
    )

    features.update(
        ssl_features
    )


    # -------------------------
    # Feature Validation
    # -------------------------

    missing = (
        set(ALL_FEATURES)
        -
        set(features.keys())
    )


    if missing:

        raise ValueError(
            f"Missing features: {missing}"
        )


    return features