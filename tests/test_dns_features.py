import pytest

from src.feature_engineering.dns_features import (
    extract_dns_features
)


pytestmark = pytest.mark.integration



def test_dns_features():

    url = (
        "https://google.com"
    )


    features = extract_dns_features(
        url
    )


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


    assert (
        "nameserver_count"
        in features
    )
