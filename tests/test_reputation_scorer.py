from src.threat_engine.reputation_scorer import (
    calculate_reputation_score
)



def test_reputation_score():


    result = calculate_reputation_score(

        phishtank_data={
            "verified": True
        },

        virustotal_data={
            "vt_detection_ratio":0.5
        },

        safe_browsing_data={
            "malware_detected":1
        }

    )


    assert (
        "reputation_score"
        in result
    )


    assert (
        result["reputation_score"] > 0
    )


    assert (
        result["reputation_level"]
        in
        [
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
        ]
    )