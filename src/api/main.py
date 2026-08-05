"""
SentinelScan API Server
-----------------------

FastAPI application entry point.

Responsibilities:
- Application initialization
- Production configuration validation
- Database initialization
- CORS configuration
- API router registration
- Root service information
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_database
from src.api.routes import router
from src.utils.config import (
    FRONTEND_URLS,
    PROJECT_NAME,
    VERSION,
    validate_production_configuration,
)
from src.utils.logger import security_logger


# ============================================================================
# Application lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(
    app: FastAPI,
) -> AsyncIterator[None]:
    """
    Run startup and shutdown operations.

    Startup:
    - Validate production configuration
    - Initialize the database
    - Log application startup

    Shutdown:
    - Log application shutdown
    """

    security_logger.info(
        "Starting %s API v%s",
        PROJECT_NAME,
        VERSION,
    )

    validate_production_configuration()

    create_database()

    security_logger.info(
        "Database initialization completed"
    )

    yield

    security_logger.info(
        "Stopping %s API",
        PROJECT_NAME,
    )


# ============================================================================
# FastAPI application
# ============================================================================

app = FastAPI(
    title=f"{PROJECT_NAME} API",
    version=VERSION,
    description="""
AI-powered phishing URL detection and security analytics API.

### Features

- Machine-learning phishing detection
- URL feature extraction
- Threat-intelligence integration
- Risk scoring
- Detection explanations
- Scan history
- Dashboard analytics
- System-health monitoring
""",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ============================================================================
# CORS middleware
# ============================================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=FRONTEND_URLS,

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "DELETE",
        "OPTIONS",
    ],

    allow_headers=[
        "Accept",
        "Authorization",
        "Content-Type",
        "X-API-Key",
    ],

    expose_headers=[
        "X-Request-ID",
        "X-Process-Time",
    ],

    max_age=600,
)


# ============================================================================
# API routes
# ============================================================================

app.include_router(
    router
)


# ============================================================================
# Root endpoint
# ============================================================================

@app.get(
    "/",
    tags=["General"],
    summary="API information",
)
def root() -> dict[str, str]:
    """
    Return basic service information and documentation paths.
    """

    return {
        "application": PROJECT_NAME,
        "description": (
            "AI-powered phishing URL detection "
            "and security analytics API"
        ),
        "version": VERSION,
        "status": "online",
        "documentation": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }