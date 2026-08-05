"""
SentinelScan

Final Risk Calculation Engine

Combines:
- ML prediction
- Threat reputation
- Security indicators

into explainable risk score.
"""


from src.utils.logger import get_logger


logger = get_logger(__name__)



def calculate_final_risk(
    ml_prediction,
    ml_confidence,
    reputation_data,
    feature_data=None
):

    """
    Generates final threat risk score.

    Score:
        0   = Safe
        100 = Critical
    """


    score = 0

    reasons = []



    # ------------------------
    # ML contribution
    # ------------------------

    if ml_prediction == 1:

        ml_score = int(
            ml_confidence * 50
        )

        score += ml_score


        reasons.append(
            "ML model detected phishing behaviour"
        )



    # ------------------------
    # Reputation contribution
    # ------------------------

    if reputation_data:


        reputation_score = reputation_data.get(
            "reputation_score",
            0
        )


        score += int(
            reputation_score * 0.4
        )


        reasons.extend(
            reputation_data.get(
                "reasons",
                []
            )
        )



    # ------------------------
    # Feature abnormalities
    # ------------------------

    if feature_data:


        if feature_data.get(
            "suspicious_domain",
            0
        ):

            score += 5

            reasons.append(
                "Suspicious domain pattern detected"
            )


        if feature_data.get(
            "young_domain",
            0
        ):

            score += 5

            reasons.append(
                "Recently registered domain detected"
            )



    score = min(
        int(score),
        100
    )



    if score >= 80:

        level = "CRITICAL"


    elif score >= 60:

        level = "HIGH"


    elif score >= 30:

        level = "MEDIUM"


    else:

        level = "LOW"



    return {

        "final_risk_score": score,

        "risk_level": level,

        "classification":
            "PHISHING"
            if ml_prediction == 1
            else
            "LEGITIMATE",

        "confidence":
            round(
                ml_confidence,
                3
            ),

        "explanation":
            reasons

    }