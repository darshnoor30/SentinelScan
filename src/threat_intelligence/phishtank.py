"""
SentinelScan

PhishTank Threat Intelligence Connector

Production-ready phishing URL reputation checker.
"""


import hashlib
import time
from pathlib import Path

import requests


from src.utils.logger import get_logger

from src.threat_intelligence.cache import (
    threat_cache
)


logger = get_logger(__name__)



# =================================================
# Configuration
# =================================================


PHISHTANK_URL = (
    "https://data.phishtank.com/data/online-valid.csv"
)


REQUEST_TIMEOUT = 15


CACHE_FILE = Path(
    "data/cache/phishtank_urls.txt"
)


CACHE_REFRESH_TIME = (
    24 * 60 * 60
)



# Reusable HTTP session

session = requests.Session()



# =================================================
# URL Utilities
# =================================================


def normalize_url(url: str) -> str:
    """
    Normalize URL for comparison.
    """

    return (
        url
        .strip()
        .lower()
        .rstrip("/")
    )



def generate_hash(url: str) -> str:
    """
    Generate cache key.
    """

    return hashlib.sha256(
        url.encode("utf-8")
    ).hexdigest()



# =================================================
# Local Database Handling
# =================================================


def load_local_database():
    """
    Load cached PhishTank URLs.
    """


    if not CACHE_FILE.exists():

        return None



    try:

        age = (
            time.time()
            -
            CACHE_FILE.stat().st_mtime
        )


        if age < CACHE_REFRESH_TIME:

            return set(
                CACHE_FILE
                .read_text(
                    encoding="utf-8"
                )
                .splitlines()
            )


    except Exception as error:

        logger.warning(
            f"Local PhishTank cache error: {error}"
        )


    return None




def download_database():
    """
    Download latest PhishTank feed once.
    """

    try:

        logger.info(
            "Updating PhishTank database..."
        )


        response = session.get(
            PHISHTANK_URL,
            timeout=REQUEST_TIMEOUT
        )


        response.raise_for_status()


        urls = set()


        lines = response.text.splitlines()



        for line in lines:

            parts = line.split(",")


            for part in parts:

                part = part.strip()


                if part.startswith("http"):

                    urls.add(
                        normalize_url(part)
                    )

                    break



        CACHE_FILE.parent.mkdir(
            parents=True,
            exist_ok=True
        )


        CACHE_FILE.write_text(
            "\n".join(urls),
            encoding="utf-8"
        )


        logger.info(
            f"PhishTank database updated: {len(urls)} URLs"
        )


        return urls



    except requests.exceptions.HTTPError as error:

        logger.warning(
            f"PhishTank HTTP error: {error}"
        )


    except requests.exceptions.Timeout:

        logger.warning(
            "PhishTank timeout"
        )


    except Exception as error:

        logger.exception(
            f"PhishTank update failed: {error}"
        )


    return set()


def get_phishtank_database():
    """
    Returns PhishTank URL database.

    Priority:
    1. Memory cache
    2. Local file cache
    3. Remote download
    """


    database = load_local_database()


    if database is not None:

        return database



    return download_database()




# =================================================
# Main Reputation Check
# =================================================


def check_phishtank(url: str) -> dict:
    """
    Check URL against PhishTank.

    Returns:

    {
        "phishtank_available": 1,
        "phishtank_listed": 0/1
    }

    """


    url = normalize_url(
        url
    )


    cache_key = generate_hash(
        url
    )



    # Memory cache

    cached = threat_cache.get(
        cache_key
    )


    if cached is not None:

        return cached




    database = get_phishtank_database()



    if not database:


        result = {

            "phishtank_available": 0,

            "phishtank_listed": 0

        }



    elif url in database:


        result = {

            "phishtank_available": 1,

            "phishtank_listed": 1

        }



    else:


        result = {

            "phishtank_available": 1,

            "phishtank_listed": 0

        }




    threat_cache.set(
        cache_key,
        result
    )


    return result




# =================================================
# Feature Wrapper
# =================================================


def extract_phishtank_features(url: str) -> dict:
    """
    Feature extraction wrapper.
    """


    result = check_phishtank(
        url
    )



    return {


        "phishtank_available":
            result[
                "phishtank_available"
            ],


        "phishtank_listed":
            result[
                "phishtank_listed"
            ]

    }