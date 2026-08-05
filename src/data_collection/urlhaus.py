"""
URLhaus Dataset Collector

Collects malicious URLs from URLhaus
(abuse.ch threat intelligence feed)
"""


import requests
import pandas as pd

from io import StringIO

from src.utils.config import PHISHING_DATA_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)


URLHAUS_URL = (
    "https://urlhaus.abuse.ch/downloads/csv_recent/"
)


def collect_urlhaus():

    logger.info(
        "Starting URLhaus collection"
    )

    try:

        response = requests.get(
            URLHAUS_URL,
            timeout=60
        )

        response.raise_for_status()


        df = pd.read_csv(
            StringIO(response.text),
            comment="#",
            header=None
        )


        logger.info(
            f"Downloaded {len(df)} records"
        )


        # URLhaus column structure:
        # 0=id
        # 1=dateadded
        # 2=url
        # 3=url_status
        # 4=last_online
        # 5=threat
        # 6=tags
        # 7=urlhaus_reference
        # 8=reporter


        df = df[[2]]

        df.columns = [
            "url"
        ]


        df = df.dropna()


        df = df.drop_duplicates()


        df["label"] = 1


        output_path = (
            PHISHING_DATA_DIR /
            "urlhaus.csv"
        )


        df.to_csv(
            output_path,
            index=False
        )


        logger.info(
            f"Saved {len(df)} malicious URLs"
        )


        return df


    except Exception as e:

        logger.error(
            f"URLhaus failed: {e}"
        )

        raise



if __name__ == "__main__":

    data = collect_urlhaus()

    print(data.head())

    print(
        f"\nTotal URLs collected: {len(data)}"
    )