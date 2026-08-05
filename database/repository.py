"""
SentinelScan Database Repository

Central database operations
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import ScanHistory




# ==================================================
# SAVE SCAN
# ==================================================


def save_scan(
    db: Session,
    result: dict
):

    scan = ScanHistory(

        scan_id=result.get(
            "scan_id"
        ),

        url=result.get(
            "url"
        ),

        prediction=result.get(
            "prediction"
        ),

        confidence=result.get(
            "confidence",
            0
        ),

        risk_score=result.get(
            "risk_score",
            0
        ),

        severity=result.get(
            "severity"
        ),

        reasons=str(
            result.get(
                "reasons",
                []
            )
        )

    )


    db.add(scan)

    db.commit()

    db.refresh(scan)

    return scan






# ==================================================
# GET ALL SCANS
# ==================================================


def get_scan_history(
    db: Session,
    limit:int = 50
):

    return (

        db.query(
            ScanHistory
        )

        .order_by(
            ScanHistory.scan_time.desc()
        )

        .limit(
            limit
        )

        .all()

    )






# ==================================================
# GET SINGLE SCAN
# ==================================================


def get_scan_by_id(
    db:Session,
    scan_id:str
):


    return (

        db.query(
            ScanHistory
        )

        .filter(
            ScanHistory.scan_id == scan_id
        )

        .first()

    )






# ==================================================
# STATISTICS
# ==================================================


def get_statistics(
    db:Session
):


    total = (

        db.query(
            ScanHistory
        )

        .count()

    )



    phishing = (

        db.query(
            ScanHistory
        )

        .filter(
            ScanHistory.prediction=="PHISHING"
        )

        .count()

    )



    suspicious = (

        db.query(
            ScanHistory
        )

        .filter(
            ScanHistory.prediction=="SUSPICIOUS"
        )

        .count()

    )



    legitimate = (

        db.query(
            ScanHistory
        )

        .filter(
            ScanHistory.prediction=="LEGITIMATE"
        )

        .count()

    )



    average_risk = (

        db.query(
            func.avg(
                ScanHistory.risk_score
            )
        )

        .scalar()

    )



    return {

        "total_scans": total,

        "phishing_detected": phishing,

        "suspicious_detected": suspicious,

        "legitimate_detected": legitimate,

        "average_risk_score":
            round(
                average_risk or 0,
                2
            )

    }