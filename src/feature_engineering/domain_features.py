"""
SentinelScan

Domain Intelligence Feature Extractor
"""


from datetime import datetime


import whois


from urllib.parse import urlparse


from src.feature_engineering.cache import (
    whois_cache
)


from src.feature_engineering.constants import (
    RISKY_TLDS,
    FREE_DOMAIN_PROVIDERS
)



def extract_domain(url):

    parsed = urlparse(url)

    return parsed.netloc.lower()



def calculate_domain_age(creation_date):

    if isinstance(
        creation_date,
        list
    ):

        creation_date = creation_date[0]


    if not creation_date:

        return -1


    # Normalize timezone differences
    if creation_date.tzinfo:

        creation_date = (
            creation_date.replace(
                tzinfo=None
            )
        )


    today = datetime.utcnow()


    return (
        today - creation_date
    ).days


def get_whois_data(domain):


    cached = whois_cache.get(
        domain
    )


    if cached:

        return cached


    try:

        data = whois.whois(
            domain
        )


        whois_cache.set(
            domain,
            data
        )


        return data


    except Exception:

        return None



def is_free_domain(domain):

    return int(
        any(
            provider in domain
            for provider in FREE_DOMAIN_PROVIDERS
        )
    )



def tld_risk_score(domain):

    tld = domain.split(".")[-1]


    if tld in RISKY_TLDS:

        return 1.0


    return 0.0



def extract_domain_features(url):


    domain = extract_domain(
        url
    )


    features = {}


    data = get_whois_data(
        domain
    )


    if data:


        features["has_whois_record"] = 1


        features["domain_age_days"] = (
            calculate_domain_age(
                data.creation_date
            )
        )


        features["registrar_known"] = int(
            bool(
                data.registrar
            )
        )


    else:


        features["has_whois_record"] = 0

        features["domain_age_days"] = -1

        features["registrar_known"] = 0



    features["is_free_domain"] = (
        is_free_domain(domain)
    )


    features["tld_risk_score"] = (
        tld_risk_score(domain)
    )


    return features