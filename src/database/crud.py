"""
SentinelScan Database CRUD Operations
"""


import json

from database.models import ScanHistory



def save_scan_result(
    db,
    result: dict
):


    scan = ScanHistory(

        scan_id=result["scan_id"],

        url=result["url"],

        prediction=result["prediction"],

        confidence=result["confidence"],

        risk_score=result["risk_score"],

        severity=result["severity"],

        reasons=json.dumps(
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




def get_recent_scans(
    db,
    limit=20
):


    return (

        db.query(
            ScanHistory
        )

        .order_by(
            ScanHistory.scan_time.desc()
        )

        .limit(limit)

        .all()

    )