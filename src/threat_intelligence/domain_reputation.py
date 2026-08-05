"""
SentinelScan

Trusted Domain Reputation Engine

Purpose:
- Detect known legitimate domains
- Reduce false positives
- Improve SOC decision accuracy
"""


from urllib.parse import urlparse



# =====================================================
# Trusted Domain Database
# =====================================================


TRUSTED_DOMAINS = {

    # Search Engines
    "google.com",
    "bing.com",
    "duckduckgo.com",


    # Technology
    "microsoft.com",
    "apple.com",
    "github.com",
    "gitlab.com",
    "python.org",


    # Cloud Platforms
    "amazon.com",
    "aws.amazon.com",
    "azure.com",
    "cloudflare.com",


    # Social / Professional
    "linkedin.com",
    "facebook.com",
    "instagram.com",


    # Reserved Testing Domains
    "example.com",
    "example.org",
    "example.net"

}



# =====================================================
# Extract Domain
# =====================================================


def extract_domain(url: str) -> str:

    """
    Extract clean domain from URL.
    """

    try:

        parsed = urlparse(url)

        domain = parsed.netloc.lower()


        if domain.startswith("www."):

            domain = domain[4:]


        return domain


    except Exception:

        return ""





# =====================================================
# Reputation Check
# =====================================================


def check_domain_reputation(url: str) -> dict:

    """
    Checks whether URL belongs to trusted domain.
    """


    domain = extract_domain(url)



    trusted = False


    for safe_domain in TRUSTED_DOMAINS:


        if (
            domain == safe_domain
            or
            domain.endswith("." + safe_domain)
        ):

            trusted = True

            break



    return {


        "domain": domain,


        "is_trusted_domain": int(trusted),


        "reputation": (

            "TRUSTED"

            if trusted

            else

            "UNKNOWN"

        )

    }