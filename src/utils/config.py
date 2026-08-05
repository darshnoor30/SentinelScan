"""
SentinelScan Configuration Manager
----------------------------------

Central configuration for:

- Project paths
- Dataset directories
- Model storage
- Logging
- Environment variables
- API security
- Database configuration
- Frontend CORS origins
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


# ============================================================================
# Base directory
# ============================================================================

BASE_DIR = Path(
    __file__
).resolve().parents[2]


# ============================================================================
# Environment configuration
# ============================================================================

ENV_FILE = BASE_DIR / ".env"

# Local development reads values from .env.
# On Render, platform environment variables take priority.
load_dotenv(
    dotenv_path=ENV_FILE,
    override=False,
)


def get_environment_variable(
    name: str,
    *,
    default: str | None = None,
    required: bool = False,
) -> str:
    """
    Read and clean an environment variable.

    Raises a clear error when a required production setting is missing.
    """

    value = os.getenv(
        name,
        default,
    )

    cleaned = str(
        value or ""
    ).strip()

    if required and not cleaned:
        raise RuntimeError(
            f"Required environment variable '{name}' is missing."
        )

    return cleaned


# ============================================================================
# Application environment
# ============================================================================

ENVIRONMENT = get_environment_variable(
    "ENVIRONMENT",
    default="development",
).lower()

IS_PRODUCTION = ENVIRONMENT == "production"


# ============================================================================
# API security
# ============================================================================

SENTINELSCAN_API_KEY = get_environment_variable(
    "SENTINELSCAN_API_KEY",
    default=(
        ""
        if IS_PRODUCTION
        else "sentinelscan-development-key"
    ),
    required=IS_PRODUCTION,
)

# Backward-compatible alias for existing imports.
API_KEY = SENTINELSCAN_API_KEY


# ============================================================================
# Database configuration
# ============================================================================

DEFAULT_SQLITE_PATH = (
    BASE_DIR
    / "data"
    / "sentinelscan.db"
)

DEFAULT_DATABASE_URL = (
    f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
)

DATABASE_URL = get_environment_variable(
    "DATABASE_URL",
    default=DEFAULT_DATABASE_URL,
)

# Some hosting providers return the older postgres:// scheme.
# SQLAlchemy expects postgresql://.
if DATABASE_URL.startswith(
    "postgres://"
):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1,
    )


# ============================================================================
# Frontend and CORS configuration
# ============================================================================

FRONTEND_URLS_RAW = get_environment_variable(
    "FRONTEND_URLS",
    default=(
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    ),
)

FRONTEND_URLS = [
    origin.strip().rstrip("/")
    for origin in FRONTEND_URLS_RAW.split(",")
    if origin.strip()
]


# ============================================================================
# Data directories
# ============================================================================

DATA_DIR = BASE_DIR / "data"

RAW_DATA_DIR = DATA_DIR / "raw"

PHISHING_DATA_DIR = (
    RAW_DATA_DIR
    / "phishing"
)

LEGITIMATE_DATA_DIR = (
    RAW_DATA_DIR
    / "legitimate"
)

PROCESSED_DATA_DIR = (
    DATA_DIR
    / "processed"
)

METADATA_DIR = (
    DATA_DIR
    / "metadata"
)


# ============================================================================
# Processed dataset files
# ============================================================================

MERGED_DATASET = (
    PROCESSED_DATA_DIR
    / "merged_dataset.csv"
)

CLEANED_DATASET = (
    PROCESSED_DATA_DIR
    / "cleaned_dataset.csv"
)

TRAIN_DATASET = (
    PROCESSED_DATA_DIR
    / "train.csv"
)

VALIDATION_DATASET = (
    PROCESSED_DATA_DIR
    / "validation.csv"
)

TEST_DATASET = (
    PROCESSED_DATA_DIR
    / "test.csv"
)


# ============================================================================
# Model directory
# ============================================================================

MODEL_DIR = (
    BASE_DIR
    / "models_saved"
)

RANDOM_FOREST_MODEL_PATH = (
    MODEL_DIR
    / "RandomForest.pkl"
)

PREPROCESSOR_PATH = (
    MODEL_DIR
    / "preprocessor.pkl"
)


# ============================================================================
# Log directory
# ============================================================================

LOG_DIR = (
    BASE_DIR
    / "logs"
)


# ============================================================================
# Application settings
# ============================================================================

PROJECT_NAME = "SentinelScan"

VERSION = "1.0.0"

RANDOM_STATE = 42

API_HOST = get_environment_variable(
    "API_HOST",
    default="0.0.0.0",
)

API_PORT = int(
    get_environment_variable(
        "PORT",
        default="8001",
    )
)

REQUEST_TIMEOUT_SECONDS = int(
    get_environment_variable(
        "REQUEST_TIMEOUT_SECONDS",
        default="30",
    )
)


# ============================================================================
# Optional threat-intelligence keys
# ============================================================================

VIRUSTOTAL_API_KEY = get_environment_variable(
    "VIRUSTOTAL_API_KEY",
    default="",
)

GOOGLE_SAFE_BROWSING_API_KEY = get_environment_variable(
    "GOOGLE_SAFE_BROWSING_API_KEY",
    default="",
)


# ============================================================================
# Required directories
# ============================================================================

REQUIRED_DIRECTORIES = [
    DATA_DIR,
    PHISHING_DATA_DIR,
    LEGITIMATE_DATA_DIR,
    PROCESSED_DATA_DIR,
    METADATA_DIR,
    MODEL_DIR,
    LOG_DIR,
]


for directory in REQUIRED_DIRECTORIES:
    directory.mkdir(
        exist_ok=True,
        parents=True,
    )


# ============================================================================
# Production validation
# ============================================================================

def validate_production_configuration() -> None:
    """
    Validate critical production settings during application startup.
    """

    if not IS_PRODUCTION:
        return

    if not API_KEY:
        raise RuntimeError(
            "SENTINELSCAN_API_KEY must be configured in production."
        )

    if API_KEY in {
        "sentinelscan-secret-key",
        "sentinelscan-development-key",
        "change-me",
    }:
        raise RuntimeError(
            "Replace the default SentinelScan API key before deployment."
        )

    if not FRONTEND_URLS:
        raise RuntimeError(
            "At least one frontend origin must be configured."
        )

    if not RANDOM_FOREST_MODEL_PATH.exists():
        raise RuntimeError(
            "RandomForest.pkl was not found at "
            f"{RANDOM_FOREST_MODEL_PATH}."
        )

    if not PREPROCESSOR_PATH.exists():
        raise RuntimeError(
            "preprocessor.pkl was not found at "
            f"{PREPROCESSOR_PATH}."
        )