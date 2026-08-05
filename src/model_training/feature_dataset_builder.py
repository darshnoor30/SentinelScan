"""
SentinelScan Optimized Feature Dataset Builder
----------------------------------------------

Features:
- Fast training-mode feature extraction
- Batch processing
- Checkpoint saving
- Resume support
- Failure tolerance
- Safe checkpoint validation
- Clean final feature dataset
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any

import pandas as pd
from tqdm import tqdm

from src.feature_engineering.feature_schema import ALL_FEATURES
from src.feature_engineering.training_features import (
    extract_training_features,
)
from src.utils.config import PROCESSED_DATA_DIR
from src.utils.logger import get_logger


logger = get_logger(__name__)


FEATURE_DIR = (
    PROCESSED_DATA_DIR
    / "features"
)

FEATURE_DIR.mkdir(
    exist_ok=True,
    parents=True,
)


CHECKPOINT_FILE = (
    FEATURE_DIR
    / "train_features_checkpoint.csv"
)

FINAL_FILE = (
    FEATURE_DIR
    / "train_features.csv"
)

FAILED_FILE = (
    FEATURE_DIR
    / "failed_urls.csv"
)


CHECKPOINT_INTERVAL = 500

# Internal-only column used for resuming.
# It is removed before the final ML dataset is saved.
SOURCE_URL_COLUMN = "__source_url"


def normalize_source_url(
    value: Any,
) -> str:
    """
    Convert a source URL into a clean checkpoint key.
    """

    return str(
        value or ""
    ).strip()


def validate_input_dataset(
    dataset: pd.DataFrame,
) -> None:
    """
    Validate the merged training dataset.
    """

    required_columns = {
        "url",
        "label",
    }

    missing_columns = (
        required_columns
        - set(dataset.columns)
    )

    if missing_columns:
        raise ValueError(
            "Input dataset is missing required columns: "
            f"{sorted(missing_columns)}"
        )

    if dataset.empty:
        raise ValueError(
            "Input dataset is empty."
        )


def load_checkpoint() -> pd.DataFrame:
    """
    Load a valid checkpoint.

    Old checkpoints without the internal source URL column are ignored,
    because they cannot safely support resume functionality.
    """

    if not CHECKPOINT_FILE.exists():
        return pd.DataFrame()

    try:
        completed = pd.read_csv(
            CHECKPOINT_FILE
        )

    except (
        pd.errors.EmptyDataError,
        pd.errors.ParserError,
        OSError,
    ) as error:
        logger.warning(
            "Checkpoint could not be read and will be ignored: %s",
            error,
        )

        CHECKPOINT_FILE.unlink(
            missing_ok=True
        )

        return pd.DataFrame()

    if completed.empty:
        logger.warning(
            "Checkpoint is empty and will be ignored."
        )

        CHECKPOINT_FILE.unlink(
            missing_ok=True
        )

        return pd.DataFrame()

    if SOURCE_URL_COLUMN not in completed.columns:
        logger.warning(
            (
                "Legacy checkpoint does not contain '%s'. "
                "It will be deleted and feature extraction will restart."
            ),
            SOURCE_URL_COLUMN,
        )

        CHECKPOINT_FILE.unlink(
            missing_ok=True
        )

        return pd.DataFrame()

    required_checkpoint_columns = (
        set(ALL_FEATURES)
        | {
            "label",
            SOURCE_URL_COLUMN,
        }
    )

    missing_columns = (
        required_checkpoint_columns
        - set(completed.columns)
    )

    if missing_columns:
        logger.warning(
            (
                "Checkpoint schema is incomplete. "
                "Missing columns: %s. Restarting extraction."
            ),
            sorted(missing_columns),
        )

        CHECKPOINT_FILE.unlink(
            missing_ok=True
        )

        return pd.DataFrame()

    logger.info(
        "Valid checkpoint found with %s completed samples.",
        len(completed),
    )

    return completed


def save_checkpoint(
    rows: list[dict[str, Any]],
) -> None:
    """
    Save extraction progress safely.

    A temporary file is written first to reduce the chance of corruption.
    """

    if not rows:
        return

    checkpoint_df = pd.DataFrame(
        rows
    )

    temporary_file = (
        CHECKPOINT_FILE.with_suffix(
            ".tmp"
        )
    )

    checkpoint_df.to_csv(
        temporary_file,
        index=False,
    )

    temporary_file.replace(
        CHECKPOINT_FILE
    )

    logger.info(
        "Checkpoint saved: %s samples",
        len(checkpoint_df),
    )


def save_failed_urls(
    failed_rows: list[dict[str, str]],
) -> None:
    """
    Save URLs that could not be processed.
    """

    if not failed_rows:
        FAILED_FILE.unlink(
            missing_ok=True
        )

        return

    pd.DataFrame(
        failed_rows
    ).to_csv(
        FAILED_FILE,
        index=False,
    )


def build_features(
    input_file: str | Path,
) -> pd.DataFrame:
    """
    Build the complete training feature dataset.
    """

    input_path = Path(
        input_file
    )

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input dataset not found: {input_path}"
        )

    logger.info(
        "Loading dataset: %s",
        input_path,
    )

    dataset = pd.read_csv(
        input_path
    )

    validate_input_dataset(
        dataset
    )

    dataset = dataset.copy()

    dataset["url"] = (
        dataset["url"]
        .astype(str)
        .str.strip()
    )

    dataset = dataset[
        dataset["url"].ne("")
    ]

    dataset = dataset.dropna(
        subset=["label"]
    )

    # Remove exact repeated URL/label pairs.
    dataset = dataset.drop_duplicates(
        subset=[
            "url",
            "label",
        ],
        keep="first",
    ).reset_index(
        drop=True
    )

    completed = load_checkpoint()

    rows: list[
        dict[str, Any]
    ] = []

    processed_urls: set[str] = set()

    if not completed.empty:
        rows = completed.to_dict(
            orient="records"
        )

        processed_urls = set(
            completed[
                SOURCE_URL_COLUMN
            ]
            .astype(str)
            .str.strip()
        )

        logger.info(
            "Resuming from %s samples.",
            len(rows),
        )

    failed_rows: list[
        dict[str, str]
    ] = []

    start_time = time.time()

    for item in tqdm(
        dataset.itertuples(
            index=False
        ),
        total=len(dataset),
        desc="Extracting features",
    ):
        url = normalize_source_url(
            item.url
        )

        if not url:
            continue

        if url in processed_urls:
            continue

        try:
            extracted = (
                extract_training_features(
                    url
                )
            )

            if not isinstance(
                extracted,
                dict,
            ):
                raise TypeError(
                    "Feature extractor did not return a dictionary."
                )

            missing_features = [
                feature
                for feature in ALL_FEATURES
                if feature not in extracted
            ]

            if missing_features:
                raise ValueError(
                    "Missing extracted features: "
                    f"{missing_features}"
                )

            row = {
                feature: extracted[
                    feature
                ]
                for feature in ALL_FEATURES
            }

            row["label"] = int(
                item.label
            )

            # Used only by the checkpoint/resume mechanism.
            row[SOURCE_URL_COLUMN] = url

            rows.append(
                row
            )

            processed_urls.add(
                url
            )

        except Exception as error:
            logger.warning(
                "Failed: %s | %s",
                url,
                error,
            )

            failed_rows.append(
                {
                    "url": url,
                    "error": str(error),
                }
            )

            continue

        if (
            len(rows) > 0
            and len(rows)
            % CHECKPOINT_INTERVAL
            == 0
        ):
            save_checkpoint(
                rows
            )

    if not rows:
        raise RuntimeError(
            "No feature rows were generated."
        )

    checkpoint_df = pd.DataFrame(
        rows
    )

    # Keep canonical feature order in the final ML dataset.
    final_columns = (
        list(ALL_FEATURES)
        + ["label"]
    )

    final_df = checkpoint_df[
        final_columns
    ].copy()

    final_df.to_csv(
        FINAL_FILE,
        index=False,
    )

    save_failed_urls(
        failed_rows
    )

    # Extraction completed successfully, so the checkpoint is no longer needed.
    CHECKPOINT_FILE.unlink(
        missing_ok=True
    )

    elapsed = (
        time.time()
        - start_time
    )

    logger.info(
        "Feature dataset completed."
    )

    logger.info(
        "Total samples: %s",
        len(final_df),
    )

    logger.info(
        "Failed samples: %s",
        len(failed_rows),
    )

    logger.info(
        "Saved to: %s",
        FINAL_FILE,
    )

    logger.info(
        "Time taken: %.2f seconds",
        elapsed,
    )

    return final_df


if __name__ == "__main__":
    build_features(
        PROCESSED_DATA_DIR
        / "train.csv"
    )