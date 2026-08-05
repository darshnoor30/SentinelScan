"""
SentinelScan
Feature Engineering Constants
"""


SUSPICIOUS_KEYWORDS = [

    "login",
    "signin",
    "verify",
    "verification",
    "secure",
    "account",
    "update",
    "password",
    "confirm",
    "wallet",
    "bank"

]


BRAND_KEYWORDS = [

    "paypal",
    "google",
    "facebook",
    "instagram",
    "microsoft",
    "apple",
    "amazon",
    "netflix",
    "coinbase",
    "linkedin"

]


SPECIAL_CHARACTERS = [

    "@",
    "-",
    "_",
    "=",
    "&",
    "%",
    "?",
    "#"

]
RISKY_TLDS = [

    "xyz",
    "top",
    "click",
    "tk",
    "ml",
    "ga",
    "cf",
    "gq"

]


FREE_DOMAIN_PROVIDERS = [

    "github.io",
    "vercel.app",
    "netlify.app",
    "blogspot.com"

]