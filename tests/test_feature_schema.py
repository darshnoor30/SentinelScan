from src.feature_engineering.url_features import (
    extract_url_features
)

from src.feature_engineering.feature_schema import (
    URL_FEATURES
)



def test_feature_schema_alignment():

    url = (
        "https://paypal-login-security.com/verify"
    )


    features = extract_url_features(
        url
    )


    extracted_features = set(
        features.keys()
    )


    expected_features = set(
        URL_FEATURES
    )


    assert (
        extracted_features
        ==
        expected_features
    )