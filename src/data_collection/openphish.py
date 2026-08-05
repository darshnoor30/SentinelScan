"""
OpenPhish Dataset Collector

Downloads real phishing URLs
from OpenPhish community feed.
"""


import requests
import pandas as pd

from pathlib import Path

from src.utils.config import PHISHING_DATA_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)


OPENPHISH_URL = (
    "https://openphish.com/feed.txt"
)


def collect_openphish():

    logger.info(
        "Starting OpenPhish collection"
    )

    try:

        response = requests.get(
            OPENPHISH_URL,
            timeout=30
        )

        response.raise_for_status()


        urls = response.text.splitlines()


        cleaned_urls = []

        for url in urls:

            url = url.strip()

            if url.startswith("http"):
                cleaned_urls.append(url)


        df = pd.DataFrame(
            {
                "url": cleaned_urls,
                "label": 1
            }
        )


        output_path = (
            PHISHING_DATA_DIR /
            "openphish.csv"
        )


        df.to_csv(
            output_path,
            index=False
        )


        logger.info(
            f"Saved {len(df)} phishing URLs"
        )


        return df


    except Exception as e:

        logger.error(
            f"OpenPhish failed: {e}"
        )

        raise



if __name__ == "__main__":

    data = collect_openphish()

    print(data.head())

    print(
        f"\nTotal URLs collected: {len(data)}"
    )