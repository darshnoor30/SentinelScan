"""
SentinelScan Model Diagnostics
------------------------------

Checks:

- Model and preprocessor loading
- Model classes
- Expected feature names
- Feature count
- Live feature extraction
- Raw and transformed feature values
- Prediction probabilities
- Potential training/inference mismatch
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from joblib import load

from src.feature_engineering.feature_pipeline import (
    extract_all_features,
)
from src.prediction.predictor import (
    FEATURE_ORDER,
    MODEL_PATH,
    PREPROCESSOR_PATH,
    normalize_url,
)


TEST_URLS = [
    "https://google.com",
    "https://github.com",
    "https://microsoft.com",
    "https://wikipedia.org",
    "https://paypal.com",
]


def print_section(title: str) -> None:
    print("\n" + "=" * 90)
    print(title)
    print("=" * 90)


def safe_shape(value: Any) -> Any:
    return getattr(value, "shape", None)


def inspect_component_metadata(
    model: Any,
    preprocessor: Any,
) -> None:
    print_section("MODEL METADATA")

    print("Model type:")
    print(type(model))

    print("\nModel classes_:")
    print(getattr(model, "classes_", "Not available"))

    print("\nModel n_features_in_:")
    print(getattr(model, "n_features_in_", "Not available"))

    print("\nModel feature_names_in_:")
    print(getattr(model, "feature_names_in_", "Not available"))

    print_section("PREPROCESSOR METADATA")

    print("Preprocessor type:")
    print(type(preprocessor))

    print("\nPreprocessor n_features_in_:")
    print(
        getattr(
            preprocessor,
            "n_features_in_",
            "Not available",
        )
    )

    print("\nPreprocessor feature_names_in_:")
    print(
        getattr(
            preprocessor,
            "feature_names_in_",
            "Not available",
        )
    )

    if hasattr(
        preprocessor,
        "get_feature_names_out",
    ):
        try:
            output_names = (
                preprocessor.get_feature_names_out()
            )

            print("\nTransformed feature names:")
            print(output_names)

            print("\nTransformed feature count:")
            print(len(output_names))

        except Exception as error:
            print(
                "\nUnable to read transformed feature names:"
            )
            print(error)


def validate_feature_contract(
    preprocessor: Any,
) -> None:
    print_section("FEATURE CONTRACT")

    print("Current inference feature count:")
    print(len(FEATURE_ORDER))

    print("\nCurrent inference feature order:")

    for index, feature in enumerate(
        FEATURE_ORDER,
        start=1,
    ):
        print(
            f"{index:02d}. {feature}"
        )

    preprocessor_features = getattr(
        preprocessor,
        "feature_names_in_",
        None,
    )

    if preprocessor_features is None:
        print(
            "\nThe saved preprocessor does not expose "
            "feature_names_in_. Exact order cannot be "
            "automatically verified."
        )

        return

    preprocessor_features = list(
        preprocessor_features
    )

    expected_features = list(
        FEATURE_ORDER
    )

    print("\nSaved preprocessor input feature count:")
    print(len(preprocessor_features))

    missing_from_inference = [
        feature
        for feature in preprocessor_features
        if feature not in expected_features
    ]

    unexpected_in_inference = [
        feature
        for feature in expected_features
        if feature not in preprocessor_features
    ]

    order_matches = (
        preprocessor_features
        == expected_features
    )

    print("\nExact feature order matches:")
    print(order_matches)

    print("\nFeatures expected by preprocessor but missing:")
    print(missing_from_inference)

    print("\nFeatures supplied by inference but not expected:")
    print(unexpected_in_inference)

    if not order_matches:
        print(
            "\nWARNING: Training and inference feature "
            "order do not match."
        )


def prepare_live_dataframe(
    features: dict[str, Any],
) -> pd.DataFrame:
    prepared = {
        feature: features.get(
            feature,
            0,
        )
        for feature in FEATURE_ORDER
    }

    dataframe = pd.DataFrame(
        [prepared],
        columns=FEATURE_ORDER,
    )

    dataframe = dataframe.replace(
        [np.inf, -np.inf],
        0,
    )

    dataframe = dataframe.fillna(0)

    return dataframe


def diagnose_url(
    url: str,
    model: Any,
    preprocessor: Any,
) -> None:
    print_section(
        f"URL DIAGNOSTIC: {url}"
    )

    normalized_url = normalize_url(url)

    print("Normalized URL:")
    print(normalized_url)

    features = extract_all_features(
        normalized_url
    )

    if not isinstance(
        features,
        dict,
    ):
        raise TypeError(
            "Feature extraction did not return a dictionary."
        )

    dataframe = prepare_live_dataframe(
        features
    )

    print("\nRaw live features:")

    for feature in FEATURE_ORDER:
        print(
            f"{feature:32s} = "
            f"{dataframe.iloc[0][feature]}"
        )

    missing_features = [
        feature
        for feature in FEATURE_ORDER
        if feature not in features
    ]

    print("\nFeatures missing from extractor output:")
    print(missing_features)

    zero_features = [
        feature
        for feature in FEATURE_ORDER
        if dataframe.iloc[0][feature] == 0
    ]

    print("\nFeatures currently equal to zero:")
    print(zero_features)

    transformed = preprocessor.transform(
        dataframe
    )

    print("\nRaw dataframe shape:")
    print(dataframe.shape)

    print("\nTransformed feature shape:")
    print(safe_shape(transformed))

    prediction = model.predict(
        transformed
    )[0]

    print("\nRaw model prediction:")
    print(prediction)

    if hasattr(
        model,
        "predict_proba",
    ):
        probabilities = model.predict_proba(
            transformed
        )[0]

        classes = list(
            getattr(
                model,
                "classes_",
                range(len(probabilities)),
            )
        )

        print("\nPrediction probabilities:")

        for class_value, probability in zip(
            classes,
            probabilities,
        ):
            print(
                f"Class {class_value!r}: "
                f"{float(probability) * 100:.2f}%"
            )

    if hasattr(
        model,
        "estimators_",
    ):
        tree_predictions = [
            estimator.predict(
                transformed
            )[0]
            for estimator in model.estimators_
        ]

        unique_values, counts = np.unique(
            tree_predictions,
            return_counts=True,
        )

        print("\nIndividual tree votes:")

        for value, count in zip(
            unique_values,
            counts,
        ):
            print(
                f"Class {value!r}: {count} trees"
            )


def main() -> None:
    print_section("LOADING COMPONENTS")

    print("Model path:")
    print(MODEL_PATH)

    print("\nPreprocessor path:")
    print(PREPROCESSOR_PATH)

    model = load(
        MODEL_PATH
    )

    preprocessor = load(
        PREPROCESSOR_PATH
    )

    inspect_component_metadata(
        model,
        preprocessor,
    )

    validate_feature_contract(
        preprocessor
    )

    for url in TEST_URLS:
        try:
            diagnose_url(
                url,
                model,
                preprocessor,
            )

        except Exception as error:
            print_section(
                f"DIAGNOSTIC FAILED: {url}"
            )

            print(
                f"{type(error).__name__}: {error}"
            )


if __name__ == "__main__":
    main()