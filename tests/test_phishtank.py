import pytest

from src.threat_intelligence.phishtank import (
    extract_phishtank_features
)


pytestmark = pytest.mark.integration



def test_phishtank():


    url = (
        "https://google.com"
    )


    features = extract_phishtank_features(
        url
    )


    assert (
        "is_phishtank_verified"
        in features
    )


    assert (
        features["is_phishtank_verified"]
        in
        [
            0,
            1
        ]
    )
