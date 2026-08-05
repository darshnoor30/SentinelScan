from src.threat_intelligence.virustotal import (
    extract_virustotal_features
)



def test_virustotal():


    url = (
        "https://google.com"
    )


    features = extract_virustotal_features(
        url
    )


    assert (
        "virustotal_available"
        in features
    )


    assert (
        "vt_malicious_votes"
        in features
    )


    assert (
        "vt_detection_ratio"
        in features
    )


    assert isinstance(
        features["vt_detection_ratio"],
        float
    )