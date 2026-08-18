from src.threat_engine.risk_calculator import calculate_final_risk


def test_risk_fusion_explains_high_confidence_threat() -> None:
    result = calculate_final_risk(
        ml_prediction=1,
        ml_confidence=0.96,
        reputation_data={
            "reputation_score": 85,
            "reasons": ["Verified by a defensive reputation source"],
        },
        feature_data={"suspicious_domain": 1, "young_domain": 1},
    )

    assert result["classification"] == "PHISHING"
    assert result["final_risk_score"] >= 80
    assert result["explanation"]
