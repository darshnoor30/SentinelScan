from src.threat_engine.risk_calculator import (
    calculate_final_risk
)



def test_risk_calculator():


    result = calculate_final_risk(

        ml_prediction=1,

        ml_confidence=0.95,

        reputation_data={

            "reputation_score":70,

            "reasons":[
                "PhishTank verified"
            ]

        },

        feature_data={

            "suspicious_domain":1,

            "young_domain":1

        }

    )


    assert (
        result["classification"]
        ==
        "PHISHING"
    )


    assert (
        result["final_risk_score"] > 0
    )


    assert (
        "explanation"
        in result
    )