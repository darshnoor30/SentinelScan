"""
SentinelScan

Threat Reputation Scoring Engine

Combines external threat intelligence
signals into an explainable score.
"""


from src.utils.logger import get_logger


logger = get_logger(__name__)



def calculate_reputation_score(
    phishtank_data=None,
    virustotal_data=None,
    safe_browsing_data=None
):

    """
    Calculates threat reputation score.

    Range:
        0   = No known threat
        100 = Extremely dangerous
    """


    score = 0

    reasons = []


    # -------------------------
    # PhishTank contribution
    # -------------------------

    if phishtank_data:

        if phishtank_data.get(
            "verified",
            False
        ):

            score += 40

            reasons.append(
                "URL verified by PhishTank"
            )



    # -------------------------
    # VirusTotal contribution
    # -------------------------

    if virustotal_data:

        ratio = virustotal_data.get(
            "vt_detection_ratio",
            0.0
        )


        if ratio > 0:


            vt_score = min(
                int(ratio * 40),
                40
            )


            score += vt_score


            reasons.append(
                "VirusTotal detected malicious behaviour"
            )



    # -------------------------
    # Google Safe Browsing
    # -------------------------

    if safe_browsing_data:


        if safe_browsing_data.get(
            "malware_detected",
            0
        ):

            score += 20

            reasons.append(
                "Google detected malware threat"
            )


        if safe_browsing_data.get(
            "social_engineering_detected",
            0
        ):

            score += 20

            reasons.append(
                "Social engineering detected"
            )



    score = min(
        score,
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

        "reputation_score": score,

        "reputation_level": level,

        "reasons": reasons

    }