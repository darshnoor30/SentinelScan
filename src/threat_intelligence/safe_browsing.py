"""
SentinelScan

Google Safe Browsing Threat Intelligence Connector
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


API_KEY = os.getenv(
    "GOOGLE_SAFE_BROWSING_API_KEY"
)


SAFE_BROWSING_URL = (
    "https://safebrowsing.googleapis.com/v4/threatMatches:find"
)



def normalize_url(url):

    return (
        url
        .strip()
        .lower()
    )



def default_result():

    return {

        "safe_browsing_available": 0,

        "malware_detected": 0,

        "social_engineering_detected": 0,

        "unwanted_software_detected": 0,

        "threat_types_count": 0

    }



def check_safe_browsing(url):

    """
    Google Safe Browsing reputation lookup.

    Returns safe fallback if unavailable.
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



    result = default_result()



    if not API_KEY:

        return result



    payload = {

        "client": {

            "clientId": "sentinelscan-ai",

            "clientVersion": "1.0"

        },

        "threatInfo": {

            "threatTypes": [

                "MALWARE",

                "SOCIAL_ENGINEERING",

                "UNWANTED_SOFTWARE"

            ],

            "platformTypes": [

                "ANY_PLATFORM"

            ],

            "threatEntryTypes": [

                "URL"

            ],

            "threatEntries": [

                {

                    "url": url

                }

            ]

        }

    }



    try:


        response = requests.post(

            SAFE_BROWSING_URL,

            params={

                "key": API_KEY

            },

            json=payload,

            timeout=10

        )


        if response.status_code != 200:

            return result



        data = response.json()



        matches = data.get(
            "matches",
            []
        )



        if matches:


            threat_types = [

                item.get(
                    "threatType"
                )

                for item in matches

            ]


            result = {

                "safe_browsing_available": 1,

                "malware_detected":
                    int(
                        "MALWARE"
                        in threat_types
                    ),

                "social_engineering_detected":
                    int(
                        "SOCIAL_ENGINEERING"
                        in threat_types
                    ),

                "unwanted_software_detected":
                    int(
                        "UNWANTED_SOFTWARE"
                        in threat_types
                    ),

                "threat_types_count":
                    len(
                        threat_types
                    )

            }


        else:

            result = {

                "safe_browsing_available": 1,

                "malware_detected": 0,

                "social_engineering_detected": 0,

                "unwanted_software_detected": 0,

                "threat_types_count": 0

            }



        threat_cache.set(

            cache_key,

            result

        )


        return result



    except Exception as error:


        logger.warning(

            f"Safe Browsing lookup failed: {error}"

        )


        return result



def extract_safe_browsing_features(url):


    return check_safe_browsing(
        url
    )