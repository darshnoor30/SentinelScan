"""
SentinelScan

Threat Intelligence Aggregation Engine

Combines:

- VirusTotal
- Google Safe Browsing
- PhishTank

Produces a unified threat intelligence report.
"""


from src.utils.logger import get_logger


from src.threat_intelligence.virustotal import (
    extract_virustotal_features
)


from src.threat_intelligence.safe_browsing import (
    check_safe_browsing
)


from src.threat_intelligence.phishtank import (
    check_phishtank
)



logger = get_logger(__name__)




# =================================================
# Default Responses
# =================================================


def default_result():

    return {

        "available": 0

    }



def calculate_summary(result):
    """
    Generate threat intelligence summary.
    """


    detected = 0


    # VirusTotal

    vt = result["virustotal"]

    if vt.get(
        "malicious_votes",
        0
    ) > 0:

        detected += 1



    # Safe Browsing

    sb = result["safe_browsing"]

    if (
        sb.get("malware_detected",0)
        or
        sb.get("social_engineering_detected",0)
    ):

        detected += 1



    # PhishTank

    pt = result["phishtank"]

    if pt.get(
        "phishtank_listed",
        0
    ):

        detected += 1



    return {

        "sources_checked": 3,

        "threat_sources_detected": detected,

        "is_known_threat":
            1 if detected > 0 else 0

    }





# =================================================
# Main Analyzer
# =================================================


def analyze_threat(url):

    """
    Run complete threat intelligence analysis.

    Returns unified threat report.
    """


    result = {}



    # -----------------------------------------
    # VirusTotal
    # -----------------------------------------


    try:

        result["virustotal"] = (
            extract_virustotal_features(url)
        )


    except Exception as error:


        logger.warning(
            f"VirusTotal analysis failed: {error}"
        )


        result["virustotal"] = (
            default_result()
        )




    # -----------------------------------------
    # Safe Browsing
    # -----------------------------------------


    try:

        result["safe_browsing"] = (
            check_safe_browsing(url)
        )


    except Exception as error:


        logger.warning(
            f"Safe Browsing analysis failed: {error}"
        )


        result["safe_browsing"] = (
            default_result()
        )




    # -----------------------------------------
    # PhishTank
    # -----------------------------------------


    try:

        result["phishtank"] = (
            check_phishtank(url)
        )


    except Exception as error:


        logger.warning(
            f"PhishTank analysis failed: {error}"
        )


        result["phishtank"] = {

            "phishtank_available":0,

            "phishtank_listed":0

        }




    # -----------------------------------------
    # Final Summary
    # -----------------------------------------


    result["summary"] = calculate_summary(
        result
    )



    return result