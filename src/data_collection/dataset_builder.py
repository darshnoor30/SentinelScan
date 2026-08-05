"""
SentinelScan
Dataset Builder

Combines:
- OpenPhish
- PhishTank
- URLhaus
- Tranco

Creates a unified research dataset.
"""


import pandas as pd
from urllib.parse import urlparse

from src.utils.config import (
    PHISHING_DATA_DIR,
    LEGITIMATE_DATA_DIR,
    MERGED_DATASET
)

from src.utils.logger import get_logger


logger = get_logger(__name__)



def normalize_url(url):

    """
    Normalize URL format
    """

    if pd.isna(url):
        return None

    url = str(url).strip()

    url = url.lower()

    return url



def extract_domain(url):

    """
    Extract domain from URL
    """

    try:

        parsed = urlparse(url)

        domain = parsed.netloc

        if domain.startswith("www."):
            domain = domain[4:]

        return domain


    except:

        return None



def load_phishing_data():

    datasets = []


    files = {

        "openphish.csv": "openphish",

        "phishtank.csv": "phishtank",

        "urlhaus.csv": "urlhaus"

    }


    for file, source in files.items():

        path = PHISHING_DATA_DIR / file


        logger.info(
            f"Loading {source}"
        )


        df = pd.read_csv(path)


        df["source"] = source

        df["label"] = 1


        datasets.append(df)



    return pd.concat(
        datasets,
        ignore_index=True
    )



def load_legitimate_data():


    path = (
        LEGITIMATE_DATA_DIR /
        "tranco.csv"
    )


    logger.info(
        "Loading Tranco"
    )


    df = pd.read_csv(path)


    df["source"] = "tranco"

    df["label"] = 0


    return df



def build_dataset():


    logger.info(
        "Starting dataset building"
    )


    phishing = load_phishing_data()

    legitimate = load_legitimate_data()



    dataset = pd.concat(
        [
            phishing,
            legitimate
        ],
        ignore_index=True
    )


    logger.info(
        f"Combined dataset size: {len(dataset)}"
    )


    # Keep only URL column

    dataset = dataset[
        [
            "url",
            "label",
            "source"
        ]
    ]


    dataset["url"] = (
        dataset["url"]
        .apply(normalize_url)
    )


    dataset["domain"] = (
        dataset["url"]
        .apply(extract_domain)
    )


    # Remove empty URLs

    dataset.dropna(
        subset=["url"],
        inplace=True
    )


    # Remove duplicates

    before = len(dataset)


    dataset.drop_duplicates(
        subset=["url"],
        inplace=True
    )


    after = len(dataset)


    logger.info(
        f"Removed {before-after} duplicates"
    )


    dataset.to_csv(
        MERGED_DATASET,
        index=False
    )


    logger.info(
        "Merged dataset saved"
    )


    return dataset



if __name__ == "__main__":


    df = build_dataset()


    print(df.head())


    print(
        "\nDataset shape:",
        df.shape
    )