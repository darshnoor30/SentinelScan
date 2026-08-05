"""
Tranco Legitimate Dataset Collector

Collects legitimate domains from Tranco ranking.
"""


import requests
import pandas as pd

from io import StringIO

from src.utils.config import LEGITIMATE_DATA_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)


TRANCO_DOWNLOAD_URL = (
    "https://tranco-list.eu/top-1m.csv.zip"
)


def collect_tranco():

    logger.info(
        "Starting Tranco collection"
    )

    try:

        response = requests.get(
            TRANCO_DOWNLOAD_URL,
            timeout=120
        )

        response.raise_for_status()


        from zipfile import ZipFile
        from io import BytesIO


        zip_file = ZipFile(
            BytesIO(response.content)
        )


        csv_file = zip_file.open(
            zip_file.namelist()[0]
        )


        df = pd.read_csv(
            csv_file,
            header=None,
            names=[
                "rank",
                "domain"
            ]
        )


        logger.info(
            f"Downloaded {len(df)} domains"
        )


        df = df[
            ["domain"]
        ]


        df = df.dropna()


        df = df.drop_duplicates()


        df["url"] = (
            "https://" +
            df["domain"].astype(str)
        )


        df = df[
            ["url"]
        ]


        # Legitimate label

        df["label"] = 0


        output_path = (
            LEGITIMATE_DATA_DIR /
            "tranco.csv"
        )


        df.to_csv(
            output_path,
            index=False
        )


        logger.info(
            f"Saved {len(df)} legitimate URLs"
        )


        return df


    except Exception as e:

        logger.error(
            f"Tranco collection failed: {e}"
        )

        raise



if __name__ == "__main__":

    data = collect_tranco()

    print(data.head())

    print(
        f"\nTotal URLs collected: {len(data)}"
    )