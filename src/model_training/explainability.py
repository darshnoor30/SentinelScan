"""
SentinelScan

SHAP Explainability Engine

Explains why the model classified a URL.
"""

import pandas as pd
import shap

from joblib import load

from pathlib import Path


from src.utils.config import MODEL_DIR
from src.utils.config import PROCESSED_DATA_DIR



MODEL_PATH = (
    MODEL_DIR /
    "RandomForest.pkl"
)


FEATURE_FILE = (
    PROCESSED_DATA_DIR /
    "features" /
    "train_features.csv"
)


OUTPUT_DIR = Path(
    "reports/shap"
)



def load_model():

    model = load(
        MODEL_PATH
    )

    return model



def load_sample():

    df = pd.read_csv(
        FEATURE_FILE
    )


    X = df.drop(
        "label",
        axis=1
    )


    sample = X.sample(
        500,
        random_state=42
    )


    return sample



def generate_explanation():

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )


    model = load_model()


    X_sample = load_sample()


    print(
        "Creating SHAP explainer..."
    )


    explainer = shap.TreeExplainer(
        model
    )


    shap_values = explainer(
        X_sample
    )


    values = shap_values.values

    # Handle binary classification SHAP output
    if len(values.shape) == 3:

        values = values[:, :, 1]

    importance = pd.DataFrame(

        {

            "feature":
                X_sample.columns,

            "importance":
                abs(values).mean(axis=0)

        }

    )

    importance = importance.sort_values(

        "importance",

        ascending=False

    )

    importance.to_csv(

        OUTPUT_DIR /
        "feature_importance.csv",

        index=False

    )

    print(
        "\nTop Important Features:"
    )

    print(
        importance.head(10)
    )



if __name__ == "__main__":

    generate_explanation()