"""
SentinelScan Professional Logging System

Handles:

- Application logs
- Security logs
- Error logs

Compatible with:
- FastAPI
- Streamlit
- CLI execution
"""


import logging
import sys
from pathlib import Path


from src.utils.config import LOG_DIR



# ==================================================
# LOG DIRECTORY
# ==================================================

LOG_DIR.mkdir(
    parents=True,
    exist_ok=True
)



# ==================================================
# LOG FILES
# ==================================================

APP_LOG_FILE = LOG_DIR / "app.log"

SECURITY_LOG_FILE = LOG_DIR / "security.log"

ERROR_LOG_FILE = LOG_DIR / "error.log"





# ==================================================
# FORMAT
# ==================================================

LOG_FORMAT = (
    "%(asctime)s | "
    "%(levelname)s | "
    "%(name)s | "
    "%(message)s"
)


DATE_FORMAT = "%Y-%m-%d %H:%M:%S"



formatter = logging.Formatter(
    LOG_FORMAT,
    DATE_FORMAT
)





# ==================================================
# CONSOLE HANDLER
# ==================================================

console_handler = logging.StreamHandler(
    sys.stdout
)


console_handler.setFormatter(
    formatter
)





# ==================================================
# LOGGER CREATOR
# ==================================================

def get_logger(
    name: str,
    log_file: Path | None = None,
    level=logging.INFO
):


    logger = logging.getLogger(
        name
    )


    logger.setLevel(
        level
    )


    logger.propagate = False



    # ----------------------------------
    # Default log file
    # ----------------------------------

    if log_file is None:

        safe_name = (
            name
            .replace(
                ".",
                "_"
            )
            .replace(
                "/",
                "_"
            )
        )


        log_file = (
            LOG_DIR /
            f"{safe_name}.log"
        )



    # ----------------------------------
    # Avoid duplicate handlers
    # ----------------------------------

    if logger.handlers:

        return logger



    # ----------------------------------
    # File Handler
    # ----------------------------------

    file_handler = logging.FileHandler(
        log_file,
        encoding="utf-8"
    )


    file_handler.setFormatter(
        formatter
    )


    file_handler.setLevel(
        level
    )


    logger.addHandler(
        file_handler
    )



    # ----------------------------------
    # Console Handler
    # ----------------------------------

    logger.addHandler(
        console_handler
    )


    return logger





# ==================================================
# SYSTEM LOGGERS
# ==================================================


app_logger = get_logger(
    "sentinelscan.app",
    APP_LOG_FILE
)



security_logger = get_logger(
    "sentinelscan.security",
    SECURITY_LOG_FILE
)



error_logger = get_logger(
    "sentinelscan.error",
    ERROR_LOG_FILE,
    logging.ERROR
)





# ==================================================
# SECURITY LOGGING
# ==================================================

def log_scan(
    url: str,
    prediction: str,
    risk_score: int,
    severity: str
):


    security_logger.info(

        "SCAN COMPLETE | "
        f"URL={url} | "
        f"PREDICTION={prediction} | "
        f"RISK={risk_score} | "
        f"SEVERITY={severity}"

    )





# ==================================================
# ERROR LOGGING
# ==================================================

def log_error(
    message: str,
    exception: Exception = None
):


    if exception:

        error_logger.exception(
            message
        )

    else:

        error_logger.error(
            message
        )