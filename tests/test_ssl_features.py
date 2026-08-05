from src.feature_engineering.ssl_features import (
    extract_ssl_features
)



def test_ssl_features():


    url = (
        "https://google.com"
    )


    features = extract_ssl_features(
        url
    )


    assert (
        "ssl_valid"
        in features
    )


    assert (
        "certificate_age_days"
        in features
    )


    assert (
        "issuer_known"
        in features
    )
    assert (
    "ssl_valid"
    in features
)


