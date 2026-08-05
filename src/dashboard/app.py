"""
SentinelScan SOC Dashboard

AI Powered Phishing Detection Platform

Features:
- Machine Learning Prediction
- Threat Intelligence
- Risk Fusion
- Explainable AI
- Scan History
"""


import sys
from pathlib import Path
from datetime import datetime


# =====================================================
# Project Root
# =====================================================

ROOT_DIR = Path(__file__).resolve().parents[2]

sys.path.insert(
    0,
    str(ROOT_DIR)
)



import streamlit as st
import pandas as pd

from pandas.errors import EmptyDataError


from src.prediction.predictor import predict_url



# =====================================================
# Streamlit Configuration
# =====================================================

st.set_page_config(
    page_title="SentinelScan SOC Dashboard",
    page_icon="🛡️",
    layout="wide"
)



# =====================================================
# Storage
# =====================================================


HISTORY_FILE = (
    ROOT_DIR /
    "data" /
    "scan_history.csv"
)




# =====================================================
# Threat Intelligence Defaults
# =====================================================


def normalize_threat_intelligence(intel):

    default = {

        "virustotal":{
            "vt_malicious_votes":0
        },

        "safe_browsing":{
            "malware_detected":0
        },

        "phishtank":{
            "phishtank_listed":0
        }

    }


    if not intel:
        return default


    for key,value in default.items():

        if key not in intel:

            intel[key] = value


    return intel




# =====================================================
# Save Scan History
# =====================================================


def save_scan_history(result):


    if result.get("prediction") == "ERROR":

        return



    HISTORY_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )



    record = {


        "timestamp":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),


        "url":
            result.get(
                "url",
                ""
            ),


        "prediction":
            result.get(
                "prediction",
                ""
            ),


        "confidence":
            result.get(
                "confidence",
                0
            ),


        "risk_score":
            result.get(
                "risk_score",
                0
            ),


        "severity":
            result.get(
                "severity",
                ""
            )

    }



    try:

        if HISTORY_FILE.exists():


            try:

                history = pd.read_csv(
                    HISTORY_FILE
                )

            except EmptyDataError:

                history = pd.DataFrame()


        else:

            history = pd.DataFrame()



        history = pd.concat(
            [
                history,
                pd.DataFrame(
                    [record]
                )
            ],
            ignore_index=True
        )


        history.to_csv(
            HISTORY_FILE,
            index=False
        )


    except Exception as e:


        st.warning(
            f"History save failed: {e}"
        )





# =====================================================
# Header
# =====================================================


st.title(
    "🛡️ SentinelScan SOC Dashboard"
)


st.markdown(
"""
AI-powered phishing URL detection platform.

Combining:

- Machine Learning
- Threat Intelligence
- Explainable AI
"""
)


st.divider()



# =====================================================
# Scanner
# =====================================================


st.subheader(
    "🔍 URL Threat Scanner"
)



url = st.text_input(
    "Enter URL",
    placeholder="https://example.com"
)



if st.button(
    "🚀 Scan URL"
):


    if not url.strip():

        st.warning(
            "Please enter a URL"
        )


    else:


        with st.spinner(
            "Analyzing URL..."
        ):


            result = predict_url(
                url.strip()
            )



        result["threat_intelligence"] = normalize_threat_intelligence(
            result.get(
                "threat_intelligence"
            )
        )



        st.session_state["latest_result"] = result



        save_scan_history(
            result
        )



        st.success(
            "Scan Completed"
        )





# =====================================================
# Display Result
# =====================================================


if "latest_result" in st.session_state:


    result = st.session_state["latest_result"]



    col1,col2,col3,col4 = st.columns(4)



    with col1:

        st.metric(
            "Prediction",
            result["prediction"]
        )


    with col2:

        st.metric(
            "Confidence",
            f"{result['confidence']:.2f}%"
        )


    with col3:

        st.metric(
            "Risk Score",
            f"{result['risk_score']}/100"
        )


    with col4:

        st.metric(
            "Severity",
            result["severity"]
        )



    st.divider()



    # =================================================
    # Threat Intelligence
    # =================================================


    st.subheader(
        "🌐 Threat Intelligence"
    )


    intel = result["threat_intelligence"]



    c1,c2,c3 = st.columns(3)



    with c1:

        st.write(
            "VirusTotal"
        )

        if intel["virustotal"].get(
            "vt_malicious_votes",
            0
        ):

            st.error(
                "Malicious"
            )

        else:

            st.success(
                "Clean"
            )



    with c2:


        st.write(
            "Google Safe Browsing"
        )


        if intel["safe_browsing"].get(
            "malware_detected",
            0
        ):

            st.error(
                "Threat detected"
            )

        else:

            st.success(
                "Clean"
            )



    with c3:


        st.write(
            "PhishTank"
        )


        if intel["phishtank"].get(
            "phishtank_listed",
            0
        ):

            st.error(
                "Listed"
            )

        else:

            st.success(
                "Not Listed"
            )




    st.divider()



    # =================================================
    # Explanation
    # =================================================


    st.subheader(
        "🤖 AI Security Explanation"
    )


    for reason in result.get(
        "reasons",
        []
    ):

        st.write(
            "✓",
            reason
        )



    st.divider()



    with st.expander(
        "Complete Scan JSON"
    ):

        st.json(
            result
        )




# =====================================================
# Scan History
# =====================================================


st.subheader(
    "📊 Previous Scans"
)



if HISTORY_FILE.exists():

    try:

        history = pd.read_csv(
            HISTORY_FILE
        )


        if not history.empty:

            st.dataframe(
                history,
                use_container_width=True
            )

        else:

            st.info(
                "No scan history available"
            )


    except EmptyDataError:

        st.info(
            "No scan history available"
        )


else:

    st.info(
        "No scan history available"
    )





st.divider()



st.caption(
    "SentinelScan | AI Threat Detection System"
)