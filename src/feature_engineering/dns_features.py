"""
SentinelScan

DNS Intelligence Feature Extractor

Features:
- DNS existence
- A record count
- MX record existence
- Nameserver count
"""


from urllib.parse import urlparse

import dns.resolver


from src.feature_engineering.cache import (
    dns_cache
)



def extract_domain(url):

    return urlparse(url).netloc.lower()



def dns_lookup(domain):

    cached = dns_cache.get(domain)

    if cached:
        return cached


    result = {}


    # -------------------------
    # A Record
    # -------------------------

    try:

        answers = dns.resolver.resolve(
            domain,
            "A",
            lifetime=3
        )

        result["a_record_count"] = len(
            answers
        )

        result["dns_exists"] = 1


    except Exception:

        result["a_record_count"] = 0

        result["dns_exists"] = 0



    # -------------------------
    # MX Record
    # -------------------------

    try:

        mx = dns.resolver.resolve(
            domain,
            "MX",
            lifetime=3
        )

        result["mx_record_exists"] = int(
            len(mx) > 0
        )


    except Exception:

        result["mx_record_exists"] = 0



    # -------------------------
    # Nameserver
    # -------------------------

    try:

        ns = dns.resolver.resolve(
            domain,
            "NS",
            lifetime=3
        )

        result["nameserver_count"] = len(
            ns
        )


    except Exception:

        result["nameserver_count"] = 0



    dns_cache.set(
        domain,
        result
    )


    return result



def extract_dns_features(url):

    domain = extract_domain(url)


    return dns_lookup(
        domain
    )