"""
Dashboard Service

This service combines all dashboard data into a single response.

The frontend will call only one endpoint:
GET /dashboard
"""

from sqlalchemy.orm import Session


class DashboardService:
    """
    Main service responsible for preparing dashboard data.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self):
        """
        Returns all dashboard information.

        NOTE:
        This is a placeholder implementation.
        We will connect analytics, alerts and health
        in the next steps.
        """

        return {
            "statistics": {},
            "recent_scans": [],
            "alerts": [],
            "health": {},
            "analytics": {
                "prediction_distribution": [],
                "risk_distribution": [],
                "top_domains": [],
                "daily_scans": []
            }
        }