"""
SentinelScan
Dataset Quality Audit

Checks:
- Class distribution
- Source distribution
- Missing values
- Duplicate URLs
- Duplicate domains
- Dataset statistics
- Suspicious URL samples
"""


import pandas as pd
import json

from src.utils.config import (
    MERGED_DATASET,
    METADATA_DIR
)

from src.utils.logger import get_logger


logger = get_logger(__name__)



AUDIT_REPORT = (
    METADATA_DIR /
    "dataset_audit_report.json"
)



def audit_dataset():

    logger.info(
        "Starting dataset audit"
    )


    # Load dataset

    df = pd.read_csv(
        MERGED_DATASET
    )


    report = {}



    # -------------------------
    # Basic information
    # -------------------------

    report["total_samples"] = len(df)

    report["columns"] = (
        list(df.columns)
    )



    # -------------------------
    # Class distribution
    # -------------------------

    label_distribution = (
        df["label"]
        .value_counts()
        .to_dict()
    )


    report["label_distribution"] = (
        label_distribution
    )



    # -------------------------
    # Source distribution
    # -------------------------

    source_distribution = (
        df["source"]
        .value_counts()
        .to_dict()
    )


    report["source_distribution"] = (
        source_distribution
    )



    # -------------------------
    # Missing values
    # -------------------------

    missing_values = (
        df.isnull()
        .sum()
        .to_dict()
    )


    report["missing_values"] = (
        missing_values
    )



    # -------------------------
    # Duplicate checks
    # -------------------------

    report["duplicate_urls"] = int(
        df["url"]
        .duplicated()
        .sum()
    )


    report["duplicate_domains"] = int(
        df["domain"]
        .duplicated()
        .sum()
    )



    # -------------------------
    # Unique statistics
    # -------------------------

    report["unique_urls"] = int(
        df["url"]
        .nunique()
    )


    report["unique_domains"] = int(
        df["domain"]
        .nunique()
    )



    # -------------------------
    # Average URL length
    # -------------------------

    df["url_length"] = (
        df["url"]
        .astype(str)
        .apply(len)
    )


    report["average_url_length"] = (
        float(
            df["url_length"]
            .mean()
        )
    )



    # -------------------------
    # Suspicious examples
    # -------------------------

    suspicious_keywords = [

        "login",
        "verify",
        "secure",
        "update",
        "account",
        "password",
        "paypal",
        "bank"

    ]


    pattern = "|".join(
        suspicious_keywords
    )


    suspicious_urls = (
        df[
            df["url"]
            .str.contains(
                pattern,
                case=False,
                na=False
            )
        ]
        ["url"]
        .head(20)
        .tolist()
    )


    report["suspicious_url_examples"] = (
        suspicious_urls
    )



    # Save report

    with open(
        AUDIT_REPORT,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=4
        )


    logger.info(
        "Dataset audit completed"
    )


    return report




if __name__ == "__main__":


    result = audit_dataset()


    print("\n========== DATASET AUDIT ==========\n")


    for key, value in result.items():

        print(
            f"{key}: {value}"
        )