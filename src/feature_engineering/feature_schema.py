"""
SentinelScan
Feature Schema

Single source of truth for ML features.
"""


URL_FEATURES = [

    "url_length",

    "domain_length",

    "path_length",

    "query_length",

    "num_dots",

    "num_hyphens",

    "num_digits",

    "num_special_chars",

    "num_subdomains",

    "has_ip_address",

    "has_at_symbol",

    "has_https",

    "has_url_encoding",

    "entropy",

    "suspicious_keyword_count",

    "brand_keyword_count",

    "tld_length"

]


DOMAIN_FEATURES = [

    "domain_age_days",

    "has_whois_record",

    "registrar_known",

    "is_free_domain",

    "tld_risk_score"

]
DNS_FEATURES = [

    "dns_exists",

    "a_record_count",

    "mx_record_exists",

    "nameserver_count"

]
SSL_FEATURES = [

    "ssl_valid",

    "certificate_age_days",

    "certificate_expiry_days",

    "issuer_known",

    "tls_version_score"

]


ALL_FEATURES = (
    URL_FEATURES
    +
    DOMAIN_FEATURES
     +
    DNS_FEATURES
     +
    SSL_FEATURES
)