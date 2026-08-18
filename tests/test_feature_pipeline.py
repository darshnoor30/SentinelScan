import pytest

from src.feature_engineering.feature_pipeline import (
    extract_all_features
)


from src.feature_engineering.feature_schema import (
    ALL_FEATURES
)


pytestmark = pytest.mark.integration



def test_feature_pipeline():


    url = (
        "https://paypal-login-security.com/verify"
    )


    features = extract_all_features(
        url
    )


    # Check total feature count

    assert (
        len(features)
        ==
        len(ALL_FEATURES)
    )


    # URL Features

    assert (
        "entropy"
        in features
    )


    assert (
        "has_https"
        in features
    )


    # Domain Features

    assert (
        "domain_age_days"
        in features
    )


    assert (
        "has_whois_record"
        in features
    )


    # DNS Features

    assert (
        "dns_exists"
        in features
    )


    assert (
        "a_record_count"
        in features
    )


    assert (
        "mx_record_exists"
        in features
    )


    # SSL Features

    assert (
        "ssl_valid"
        in features
    )


    assert (
        "certificate_age_days"
        in features
    )


    assert (
        "certificate_expiry_days"
        in features
    )


    assert (
        "issuer_known"
        in features
    )
