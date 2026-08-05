"""
SentinelScan

Advanced ML Model Training

Models:
- XGBoost
- LightGBM
- CatBoost
"""


import pandas as pd

from joblib import dump


from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier


from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)


from src.model_training.preprocessing import (
    prepare_data
)

from src.utils.config import (
    PROCESSED_DATA_DIR,
    MODEL_DIR
)

from src.utils.logger import get_logger



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


    return {

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




def train():

    logger.info(
        "Loading feature dataset"
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


        "XGBoost":

        XGBClassifier(

            n_estimators=300,

            learning_rate=0.05,

            max_depth=8,

            random_state=42,

            n_jobs=-1,

            eval_metric="logloss"

        ),



        "LightGBM":

        LGBMClassifier(

            n_estimators=300,

            learning_rate=0.05,

            random_state=42,

            n_jobs=-1

        ),



        "CatBoost":

        CatBoostClassifier(

            iterations=300,

            learning_rate=0.05,

            depth=8,

            verbose=0,

            random_seed=42

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


        result = evaluate_model(

            name,

            model,

            X_test,

            y_test

        )


        results.append(
            result
        )


        dump(

            model,

            MODEL_DIR /
            f"{name}.pkl"

        )


        logger.info(
            f"{name} saved"
        )



    results_df = pd.DataFrame(
        results
    )


    results_df.to_csv(

        MODEL_DIR /
        "advanced_model_results.csv",

        index=False

    )


    print(results_df)



if __name__ == "__main__":

    train()