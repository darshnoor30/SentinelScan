"""
SentinelScan Database Models
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text
)

from datetime import datetime

from database.database import Base



class ScanHistory(Base):

    """
    Stores every URL scan result
    """

    __tablename__ = "scan_history"



    id = Column(

        Integer,

        primary_key=True,

        index=True

    )


    scan_id = Column(

        String(100),

        unique=True,

        index=True,

        nullable=False

    )


    scan_time = Column(

        DateTime,

        default=datetime.utcnow

    )


    url = Column(

        Text,

        nullable=False

    )


    prediction = Column(

        String(50),

        nullable=False

    )


    confidence = Column(

        Float,

        nullable=False

    )


    risk_score = Column(

        Integer,

        nullable=False

    )


    severity = Column(

        String(50),

        nullable=False

    )


    reasons = Column(

        Text,

        nullable=True

    )