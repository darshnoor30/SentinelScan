from src.feature_engineering.feature_schema import URL_FEATURES
from src.feature_engineering.url_features import extract_url_features


def test_url_feature_contract_is_complete_and_numeric() -> None:
    features = extract_url_features(
        "https://accounts.example.com/verify?continue=%2Fdashboard"
    )

    assert set(features) == set(URL_FEATURES)
    assert all(isinstance(value, (int, float)) for value in features.values())


def test_ip_and_cleartext_signals_are_detected() -> None:
    features = extract_url_features("http://198.51.100.8/login")

    assert features["has_ip_address"] == 1
    assert features["has_https"] == 0
