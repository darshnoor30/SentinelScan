"""
SentinelScan
Dataset Verification

Checks:
- Class balance
- Domain leakage
- Dataset integrity
"""


import pandas as pd

from src.utils.config import (
    TRAIN_DATASET,
    VALIDATION_DATASET,
    TEST_DATASET
)


def verify_dataset():


    train = pd.read_csv(
        TRAIN_DATASET
    )

    val = pd.read_csv(
        VALIDATION_DATASET
    )

    test = pd.read_csv(
        TEST_DATASET
    )


    print("\n========== DATASET SIZE ==========")

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


    print(
        "\n========== CLASS DISTRIBUTION =========="
    )


    for name, df in [
        ("Train", train),
        ("Validation", val),
        ("Test", test)
    ]:

        print(
            f"\n{name}"
        )

        print(
            df["label"]
            .value_counts()
        )


    print(
        "\n========== DOMAIN LEAKAGE CHECK =========="
    )


    train_domains = set(
        train["domain"]
    )

    val_domains = set(
        val["domain"]
    )

    test_domains = set(
        test["domain"]
    )


    print(
        "Train-Val overlap:",
        len(
            train_domains &
            val_domains
        )
    )


    print(
        "Train-Test overlap:",
        len(
            train_domains &
            test_domains
        )
    )


    print(
        "Val-Test overlap:",
        len(
            val_domains &
            test_domains
        )
    )


    print(
        "\n========== UNIQUE DOMAINS =========="
    )


    print(
        "Train domains:",
        len(train_domains)
    )

    print(
        "Validation domains:",
        len(val_domains)
    )

    print(
        "Test domains:",
        len(test_domains)
    )



if __name__ == "__main__":

    verify_dataset()