"""
SentinelScan

VirusTotal Threat Intelligence Connector
"""


import os
import hashlib
import requests

from dotenv import load_dotenv

from src.utils.logger import get_logger

from src.threat_intelligence.cache import (
    threat_cache
)


load_dotenv()


logger = get_logger(__name__)


VT_API_URL = (
    "https://www.virustotal.com/api/v3/urls"
)



API_KEY = os.getenv(
    "VIRUSTOTAL_API_KEY"
)



def normalize_url(url):

    return (
        url
        .strip()
        .lower()
    )



def url_identifier(url):

    """
    VirusTotal requires base64 URL id.
    """

    import base64


    encoded = base64.urlsafe_b64encode(
        url.encode()
    ).decode()


    return encoded.rstrip("=")



def calculate_ratio(
        malicious,
        suspicious,
        total
):

    if total == 0:

        return 0


    return round(
        (
            malicious + suspicious
        )
        /
        total,
        3
    )



def check_virustotal(url):

    """
    Returns VirusTotal reputation data.

    Safe fallback when API unavailable.
    """


    url = normalize_url(
        url
    )


    cache_key = hashlib.sha256(
        url.encode()
    ).hexdigest()


    cached = threat_cache.get(
        cache_key
    )


    if cached:

        return cached



    result = {

        "virustotal_available": 0,

        "vt_malicious_votes": 0,

        "vt_suspicious_votes": 0,

        "vt_detection_ratio": 0.0

    }



    if not API_KEY:

        return result



    try:

        headers = {

            "x-apikey": API_KEY

        }


        url_id = url_identifier(
            url
        )


        response = requests.get(

            f"{VT_API_URL}/{url_id}",

            headers=headers,

            timeout=10

        )


        if response.status_code != 200:

            return result



        data = response.json()



        stats = (
            data
            ["data"]
            ["attributes"]
            ["last_analysis_stats"]
        )


        malicious = stats.get(
            "malicious",
            0
        )


        suspicious = stats.get(
            "suspicious",
            0
        )


        harmless = stats.get(
            "harmless",
            0
        )


        total = (
            malicious
            +
            suspicious
            +
            harmless
        )


        result = {

            "virustotal_available": 1,

            "vt_malicious_votes": malicious,

            "vt_suspicious_votes": suspicious,

            "vt_detection_ratio":
                calculate_ratio(
                    malicious,
                    suspicious,
                    total
                )

        }


        threat_cache.set(
            cache_key,
            result
        )


        return result



    except Exception as error:


        logger.warning(
            f"VirusTotal lookup failed: {error}"
        )


        return result



def extract_virustotal_features(url):


    return check_virustotal(
        url
    )