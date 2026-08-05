"""
SentinelScan

Model Registry

Automatically selects the best performing model.
"""

import pandas as pd

from pathlib import Path

from src.utils.config import MODEL_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)



RESULT_FILES = [
    MODEL_DIR / "model_results.csv",
    MODEL_DIR / "advanced_model_results.csv"
]



def load_results():

    results = []

    for file in RESULT_FILES:

        if file.exists():

            df = pd.read_csv(file)

            results.append(df)


    if not results:

        raise FileNotFoundError(
            "No model results found"
        )


    return pd.concat(
        results,
        ignore_index=True
    )



def select_best_model():

    df = load_results()


    # prioritize recall and F1
    df = df.sort_values(
        by=[
            "recall",
            "f1_score",
            "roc_auc"
        ],
        ascending=False
    )


    best = df.iloc[0]


    return {

        "model":
            best["model"],

        "accuracy":
            float(best["accuracy"]),

        "precision":
            float(best["precision"]),

        "recall":
            float(best["recall"]),

        "f1_score":
            float(best["f1_score"]),

        "roc_auc":
            float(best["roc_auc"])

    }



if __name__ == "__main__":

    result = select_best_model()

    print(
        "\n===== BEST MODEL ====="
    )

    for key, value in result.items():

        print(
            f"{key}: {value}"
        )