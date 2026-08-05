"""
Dashboard Analytics

Production-ready dashboard analytics service.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database.models import ScanHistory


class DashboardAnalytics:

    def __init__(self, db: Session):
        self.db = db

    # ----------------------------------------------------
    # Prediction Distribution
    # ----------------------------------------------------

    def get_prediction_distribution(self):

        rows = (
            self.db.query(
                ScanHistory.prediction,
                func.count(ScanHistory.id)
            )
            .group_by(ScanHistory.prediction)
            .all()
        )

        result = []

        for prediction, count in rows:

            result.append(
                {
                    "prediction": prediction,
                    "count": count
                }
            )

        return result

    # ----------------------------------------------------
    # Risk Distribution
    # ----------------------------------------------------

    def get_risk_distribution(self):

        scans = self.db.query(
            ScanHistory.risk_score
        ).all()

        buckets = {
            "0-20": 0,
            "21-40": 0,
            "41-60": 0,
            "61-80": 0,
            "81-100": 0
        }

        for (risk,) in scans:

            risk = risk or 0

            if risk <= 20:

                buckets["0-20"] += 1

            elif risk <= 40:

                buckets["21-40"] += 1

            elif risk <= 60:

                buckets["41-60"] += 1

            elif risk <= 80:

                buckets["61-80"] += 1

            else:

                buckets["81-100"] += 1

        return [

            {
                "range": key,
                "count": value
            }

            for key, value in buckets.items()

        ]

    # ----------------------------------------------------
    # Top Domains
    # ----------------------------------------------------

    def get_top_domains(self, limit: int = 10):

        rows = (
            self.db.query(
                ScanHistory.url,
                func.count(ScanHistory.id).label("count")
            )
            .group_by(ScanHistory.url)
            .order_by(desc("count"))
            .limit(limit)
            .all()
        )

        domains = []

        for url, count in rows:

            domain = url

            domain = domain.replace("https://", "")
            domain = domain.replace("http://", "")
            domain = domain.split("/")[0]

            domains.append(
                {
                    "domain": domain,
                    "count": count
                }
            )

        return domains

    # ----------------------------------------------------
    # Daily Scans
    # ----------------------------------------------------

    def daily_scans(self):

        rows = (
            self.db.query(
                func.date(ScanHistory.scan_time),
                func.count(ScanHistory.id)
            )
            .group_by(
                func.date(ScanHistory.scan_time)
            )
            .order_by(
                func.date(ScanHistory.scan_time)
            )
            .all()
        )

        return [

            {
                "date": str(date),
                "count": count
            }

            for date, count in rows

        ]

    # ----------------------------------------------------
    # Average Risk
    # ----------------------------------------------------

    def average_risk(self):

        avg = (
            self.db.query(
                func.avg(
                    ScanHistory.risk_score
                )
            ).scalar()
        )

        return round(avg or 0, 2)

    # ----------------------------------------------------
    # Recent Scans
    # ----------------------------------------------------

    def recent_scans(self, limit: int = 5):

        rows = (
            self.db.query(ScanHistory)
            .order_by(
                ScanHistory.scan_time.desc()
            )
            .limit(limit)
            .all()
        )

        result = []

        for scan in rows:

            result.append(

                {
                    "scan_id": scan.scan_id,
                    "url": scan.url,
                    "prediction": scan.prediction,
                    "risk_score": scan.risk_score,
                    "confidence": scan.confidence,
                    "severity": scan.severity,
                    "scan_time": scan.scan_time.isoformat()
                }

            )

        return result