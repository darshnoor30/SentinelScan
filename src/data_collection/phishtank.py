"""
PhishTank Dataset Collector

Downloads verified phishing URLs
from PhishTank public database.
"""


import requests
import pandas as pd

from src.utils.config import PHISHING_DATA_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)


PHISHTANK_URL = (
    "https://data.phishtank.com/data/online-valid.csv"
)


def collect_phishtank():

    logger.info(
        "Starting PhishTank collection"
    )

    try:

        response = requests.get(
            PHISHTANK_URL,
            timeout=60
        )

        response.raise_for_status()


        from io import StringIO


        df = pd.read_csv(
            StringIO(response.text)
        )


        logger.info(
            f"Downloaded {len(df)} records"
        )


        # Keep only required columns

        df = df[
            ["url"]
        ]


        # Remove missing URLs

        df = df.dropna()


        # Remove duplicates

        df = df.drop_duplicates()


        # Add phishing label

        df["label"] = 1


        output_path = (
            PHISHING_DATA_DIR /
            "phishtank.csv"
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
            f"PhishTank collection failed: {e}"
        )

        raise



if __name__ == "__main__":

    data = collect_phishtank()


    print(
        data.head()
    )


    print(
        f"\nTotal URLs collected: {len(data)}"
    )