"""
SentinelScan
Dataset Preparation Pipeline

Responsibilities:
- Balance dataset
- Remove domain leakage
- Create train/validation/test splits
"""


import pandas as pd

from sklearn.model_selection import train_test_split

from src.utils.config import (
    MERGED_DATASET,
    TRAIN_DATASET,
    VALIDATION_DATASET,
    TEST_DATASET,
    RANDOM_STATE
)

from src.utils.logger import get_logger


logger = get_logger(__name__)



def prepare_dataset():


    logger.info(
        "Starting dataset preparation"
    )


    # -------------------------
    # Load merged dataset
    # -------------------------

    df = pd.read_csv(
        MERGED_DATASET
    )


    logger.info(
        f"Original dataset: {len(df)}"
    )


    # -------------------------
    # Separate classes
    # -------------------------

    phishing = df[
        df["label"] == 1
    ]


    legitimate = df[
        df["label"] == 0
    ]



    logger.info(
        f"Phishing samples: {len(phishing)}"
    )


    logger.info(
        f"Legitimate samples: {len(legitimate)}"
    )



    # -------------------------
    # Sample legitimate URLs
    # -------------------------

    legitimate_sample = (
        legitimate
        .sample(
            n=200000,
            random_state=RANDOM_STATE
        )
    )


    df = pd.concat(
        [
            phishing,
            legitimate_sample
        ],
        ignore_index=True
    )



    # Shuffle

    df = df.sample(
        frac=1,
        random_state=RANDOM_STATE
    ).reset_index(
        drop=True
    )


    logger.info(
        f"Balanced dataset size: {len(df)}"
    )



    # -------------------------
    # Domain based split
    # -------------------------

    unique_domains = (
        df["domain"]
        .drop_duplicates()
    )


    train_domains, temp_domains = (
        train_test_split(
            unique_domains,
            test_size=0.30,
            random_state=RANDOM_STATE
        )
    )


    val_domains, test_domains = (
        train_test_split(
            temp_domains,
            test_size=0.50,
            random_state=RANDOM_STATE
        )
    )



    train_df = df[
        df["domain"]
        .isin(train_domains)
    ]


    val_df = df[
        df["domain"]
        .isin(val_domains)
    ]


    test_df = df[
        df["domain"]
        .isin(test_domains)
    ]



    logger.info(
        f"Train size: {len(train_df)}"
    )

    logger.info(
        f"Validation size: {len(val_df)}"
    )

    logger.info(
        f"Test size: {len(test_df)}"
    )



    # -------------------------
    # Save datasets
    # -------------------------

    train_df.to_csv(
        TRAIN_DATASET,
        index=False
    )


    val_df.to_csv(
        VALIDATION_DATASET,
        index=False
    )


    test_df.to_csv(
        TEST_DATASET,
        index=False
    )



    logger.info(
        "Dataset preparation completed"
    )


    return (
        train_df,
        val_df,
        test_df
    )




if __name__ == "__main__":


    train, val, test = (
        prepare_dataset()
    )


    print("\n========== FINAL DATASET ==========")


    print(
        "Train:",
        train.shape
    )


    print(
        "Validation:",
        val.shape
    )


    print(
        "Test:",
        test.shape
    )