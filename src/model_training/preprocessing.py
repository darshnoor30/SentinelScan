"""
SentinelScan

ML preprocessing pipeline
"""

import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from joblib import dump


from src.utils.config import MODEL_DIR



def load_feature_dataset(path):

    df = pd.read_csv(path)

    X = df.drop(
        "label",
        axis=1
    )

    y = df["label"]

    return X, y



def create_preprocessor():

    pipeline = Pipeline(
        [
            (
                "scaler",
                StandardScaler()
            )
        ]
    )

    return pipeline



def prepare_data(path):

    X, y = load_feature_dataset(
        path
    )


    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )


    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=0.5,
        random_state=42,
        stratify=y_temp
    )


    preprocessor = create_preprocessor()


    X_train = preprocessor.fit_transform(
        X_train
    )

    X_val = preprocessor.transform(
        X_val
    )

    X_test = preprocessor.transform(
        X_test
    )


    dump(
        preprocessor,
        MODEL_DIR / "preprocessor.pkl"
    )


    return (
        X_train,
        X_val,
        X_test,
        y_train,
        y_val,
        y_test
    )