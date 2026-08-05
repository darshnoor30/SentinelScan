"""
SentinelScan Database Configuration

Handles:
- Database engine
- Session management
- ORM base

Compatible with:
- SQLite (development)
- PostgreSQL (production)
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path


# =====================================================
# DATABASE LOCATION
# =====================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATABASE_DIR = BASE_DIR / "data"

DATABASE_DIR.mkdir(
    exist_ok=True
)


DATABASE_URL = (
    f"sqlite:///{DATABASE_DIR}/sentinelscan.db"
)



# =====================================================
# ENGINE
# =====================================================


engine = create_engine(

    DATABASE_URL,

    connect_args={
        "check_same_thread": False
    }

)



# =====================================================
# SESSION
# =====================================================


SessionLocal = sessionmaker(

    autocommit=False,

    autoflush=False,

    bind=engine

)



# =====================================================
# BASE MODEL
# =====================================================


Base = declarative_base()



# =====================================================
# DATABASE DEPENDENCY
# =====================================================


def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()