from src.feature_engineering.url_features import (
    extract_url_features
)


def test_url_features():

    url = (
        "https://paypal-login-security.com/verify"
    )


    features = extract_url_features(
        url
    )


    assert "url_length" in features

    assert (
        features["has_https"] == 1
    )

    assert (
        features["brand_keyword_count"] > 0
    )