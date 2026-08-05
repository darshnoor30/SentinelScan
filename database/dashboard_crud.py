from collections import Counter
from urllib.parse import urlparse

from database.models import ScanHistory


def get_prediction_distribution(db):

    scans = db.query(ScanHistory).all()

    counter = Counter(scan.prediction for scan in scans)

    return {
        "LEGITIMATE": counter.get("LEGITIMATE", 0),
        "SUSPICIOUS": counter.get("SUSPICIOUS", 0),
        "PHISHING": counter.get("PHISHING", 0)
    }


def get_risk_distribution(db):

    scans = db.query(ScanHistory).all()

    distribution = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
        "CRITICAL": 0
    }

    for scan in scans:

        score = scan.risk_score or 0

        if score <= 25:
            distribution["LOW"] += 1

        elif score <= 50:
            distribution["MEDIUM"] += 1

        elif score <= 75:
            distribution["HIGH"] += 1

        else:
            distribution["CRITICAL"] += 1

    return distribution


def get_top_domains(db, limit=10):

    scans = db.query(ScanHistory).all()

    domains = []

    for scan in scans:

        try:

            domain = urlparse(scan.url).netloc

            if domain:
                domains.append(domain)

        except Exception:
            pass

    counter = Counter(domains)

    return [
        {
            "domain": domain,
            "count": count
        }
        for domain, count in counter.most_common(limit)
    ]