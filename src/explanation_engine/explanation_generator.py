"""
SentinelScan

Explainable AI Explanation Generator

Generates human-readable security explanations from:

- ML prediction
- URL features
- SHAP feature importance
"""


from pathlib import Path
import pandas as pd



SHAP_FILE = Path(
    "reports/shap/feature_importance.csv"
)



# =====================================================
# Load SHAP Importance
# =====================================================


def load_feature_importance():

    if not SHAP_FILE.exists():

        return {}


    try:

        df = pd.read_csv(
            SHAP_FILE
        )


        return dict(
            zip(
                df["feature"],
                df["importance"]
            )
        )


    except Exception:

        return {}




# =====================================================
# Generate Explanation
# =====================================================


def generate_explanation(
    prediction,
    features
):

    reasons = []



    # =========================
    # ML Explanation
    # =========================


    if prediction == "PHISHING":

        reasons.append(
            "Machine learning model detected phishing characteristics"
        )


    else:

        reasons.append(
            "Machine learning model found no major phishing indicators"
        )



    # =========================
    # SSL
    # =========================


    if features.get(
        "ssl_valid",
        0
    ):

        reasons.append(
            "Valid SSL certificate detected"
        )


    else:

        reasons.append(
            "SSL certificate validation failed"
        )



    # =========================
    # URL Threat Indicators
    # =========================


    if features.get(
        "has_ip_address",
        0
    ):

        reasons.append(
            "URL contains IP address instead of domain"
        )


    if features.get(
        "suspicious_keyword_count",
        0
    ) > 0:

        reasons.append(
            "Suspicious keywords detected in URL"
        )


    if features.get(
        "entropy",
        0
    ) > 4:

        reasons.append(
            "High URL randomness detected"
        )



    # =========================
    # Domain Age
    # =========================


    age = features.get(
        "domain_age_days",
        -1
    )


    if (
        age != -1
        and age < 30
    ):

        reasons.append(
            "Recently registered domain detected"
        )



    # =========================
    # SHAP Explanation
    # =========================


    importance = load_feature_importance()


    if importance:


        top_features = sorted(
            importance.items(),
            key=lambda x:x[1],
            reverse=True
        )[:3]


        for feature, _ in top_features:

            reasons.append(
                f"Important security indicator: {feature}"
            )



    # Remove duplicates

    reasons = list(
        dict.fromkeys(
            reasons
        )
    )


    return reasons