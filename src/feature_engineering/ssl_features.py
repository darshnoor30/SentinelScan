"""
SentinelScan

SSL/TLS Intelligence Feature Extractor

Extracts certificate based security signals.
"""


import ssl
import socket

from datetime import datetime

from urllib.parse import urlparse


from src.feature_engineering.cache import (
    ssl_cache
)



def extract_domain(url):

    return urlparse(url).netloc.split(":")[0]



def get_certificate(domain):

    cached = ssl_cache.get(
        domain
    )

    if cached:

        return cached


    try:

        context = ssl.create_default_context()


        with socket.create_connection(
            (domain, 443),
            timeout=5
        ) as sock:


            with context.wrap_socket(
                sock,
                server_hostname=domain
            ) as ssock:


                certificate = (
                    ssock.getpeercert()
                )


        ssl_cache.set(
            domain,
            certificate
        )


        return certificate


    except Exception:

        return None



def calculate_date_difference(date):

    if not date:

        return -1


    today = datetime.utcnow()


    return (
        date - today
    ).days



def extract_ssl_features(url):


    domain = extract_domain(
        url
    )


    features = {


        "ssl_valid": 0,

        "certificate_age_days": -1,

        "certificate_expiry_days": -1,

        "issuer_known": 0,

        "tls_version_score": 0

    }


    certificate = get_certificate(
        domain
    )


    if not certificate:

        return features



    features["ssl_valid"] = 1



    # Certificate issuer

    issuer = certificate.get(
        "issuer"
    )


    if issuer:

        features["issuer_known"] = 1



    # Expiry

    expiry = certificate.get(
        "notAfter"
    )


    if expiry:

        try:

            expiry_date = (
                ssl.cert_time_to_seconds(
                    expiry
                )
            )

            expiry_date = datetime.fromtimestamp(
                expiry_date
            )


            features[
                "certificate_expiry_days"
            ] = (
                expiry_date - datetime.utcnow()
            ).days


        except Exception:

            pass



    return features