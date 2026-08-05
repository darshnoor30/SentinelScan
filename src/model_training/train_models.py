"""
SentinelScan

Model Training Pipeline

Models:
- Logistic Regression
- Random Forest
- XGBoost
- LightGBM
"""


import pandas as pd

from pathlib import Path

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from joblib import dump


from src.model_training.preprocessing import (
    prepare_data
)

from src.utils.config import (
    PROCESSED_DATA_DIR,
    MODEL_DIR
)

from src.utils.logger import (
    get_logger
)



logger = get_logger(__name__)



FEATURE_FILE = (
    PROCESSED_DATA_DIR /
    "features" /
    "train_features.csv"
)



def evaluate_model(
    name,
    model,
    X_test,
    y_test
):

    predictions = model.predict(
        X_test
    )


    probabilities = model.predict_proba(
        X_test
    )[:,1]


    results = {

        "model": name,

        "accuracy":
            accuracy_score(
                y_test,
                predictions
            ),

        "precision":
            precision_score(
                y_test,
                predictions
            ),

        "recall":
            recall_score(
                y_test,
                predictions
            ),

        "f1_score":
            f1_score(
                y_test,
                predictions
            ),

        "roc_auc":
            roc_auc_score(
                y_test,
                probabilities
            )

    }


    return results




def train():

    logger.info(
        "Loading dataset"
    )


    (
        X_train,
        X_val,
        X_test,
        y_train,
        y_val,
        y_test

    ) = prepare_data(
        FEATURE_FILE
    )



    models = {


        "LogisticRegression":

        LogisticRegression(
            max_iter=1000,
            random_state=42
        ),



        "RandomForest":

        RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            n_jobs=-1
        )

    }



    results = []



    for name, model in models.items():

        logger.info(
            f"Training {name}"
        )


        model.fit(
            X_train,
            y_train
        )


        score = evaluate_model(
            name,
            model,
            X_test,
            y_test
        )


        results.append(
            score
        )


        dump(

            model,

            MODEL_DIR /
            f"{name}.pkl"

        )


        logger.info(
            f"{name} completed"
        )



    results_df = pd.DataFrame(
        results
    )


    results_df.to_csv(
        MODEL_DIR /
        "model_results.csv",
        index=False
    )


    print(
        results_df
    )



if __name__ == "__main__":

    train()