import pytest

from src.threat_intelligence.safe_browsing import (
    extract_safe_browsing_features
)


pytestmark = pytest.mark.integration



def test_safe_browsing():


    url = (
        "https://google.com"
    )


    features = extract_safe_browsing_features(
        url
    )


    assert (
        "safe_browsing_available"
        in features
    )


    assert (
        "malware_detected"
        in features
    )


    assert (
        "threat_types_count"
        in features
    )


    assert isinstance(
        features["threat_types_count"],
        int
    )
