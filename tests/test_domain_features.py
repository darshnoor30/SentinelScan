import pytest

from src.feature_engineering.domain_features import (
    extract_domain_features
)


pytestmark = pytest.mark.integration



def test_domain_features():


    url = (
        "https://google.com"
    )


    features = extract_domain_features(
        url
    )


    assert (
        "domain_age_days"
        in features
    )


    assert (
        "tld_risk_score"
        in features
    )
