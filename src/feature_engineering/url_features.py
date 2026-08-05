"""
SentinelScan URL Feature Extraction Engine
------------------------------------------

Extracts deterministic lexical and structural URL features.

The same normalization and extraction logic must be used during:
- feature-dataset creation
- model training
- live inference
"""

from __future__ import annotations

import ipaddress
import math
import re
from typing import Any
from urllib.parse import (
    unquote,
    urlsplit,
    urlunsplit,
)

from src.feature_engineering.constants import (
    BRAND_KEYWORDS,
    SUSPICIOUS_KEYWORDS,
)


MAX_URL_LENGTH = 2048


def normalize_url_for_features(
    value: Any,
) -> str:
    """
    Normalize a URL into one consistent HTTP/HTTPS representation.

    Examples:
        google.com
        -> https://google.com/

        www.github.com/path
        -> https://www.github.com/path
    """

    raw_url = str(
        value or ""
    ).strip()

    if not raw_url:
        raise ValueError(
            "URL cannot be empty."
        )

    if len(raw_url) > MAX_URL_LENGTH:
        raise ValueError(
            "URL exceeds the supported maximum length."
        )

    if "://" not in raw_url:
        raw_url = (
            f"https://{raw_url}"
        )

    parsed = urlsplit(
        raw_url
    )

    scheme = (
        parsed.scheme
        .strip()
        .lower()
    )

    if scheme not in {
        "http",
        "https",
    }:
        raise ValueError(
            "Only HTTP and HTTPS URLs are supported."
        )

    hostname = (
        parsed.hostname
        or ""
    ).strip().lower()

    if not hostname:
        raise ValueError(
            "URL must contain a hostname."
        )

    try:
        hostname = hostname.encode(
            "idna"
        ).decode(
            "ascii"
        )
    except UnicodeError as error:
        raise ValueError(
            "URL contains an invalid internationalized hostname."
        ) from error

    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError(
            "URL contains an invalid port."
        ) from error

    if ":" in hostname:
        normalized_host = (
            f"[{hostname}]"
        )
    else:
        normalized_host = hostname

    netloc = normalized_host

    if port is not None:
        default_port = (
            scheme == "https"
            and port == 443
        ) or (
            scheme == "http"
            and port == 80
        )

        if not default_port:
            netloc = (
                f"{normalized_host}:{port}"
            )

    path = parsed.path or "/"

    return urlunsplit(
        (
            scheme,
            netloc,
            path,
            parsed.query,
            "",
        )
    )


def calculate_entropy(
    text: str,
) -> float:
    """
    Calculate Shannon entropy for a string.
    """

    if not text:
        return 0.0

    length = len(text)

    character_counts: dict[str, int] = {}

    for character in text:
        character_counts[character] = (
            character_counts.get(
                character,
                0,
            )
            + 1
        )

    entropy = -sum(
        (
            count / length
        )
        * math.log2(
            count / length
        )
        for count
        in character_counts.values()
    )

    return round(
        entropy,
        4,
    )


def is_ip_address(
    hostname: str,
) -> int:
    """
    Return 1 for valid IPv4 or IPv6 hosts.
    """

    candidate = (
        hostname or ""
    ).strip(
        "[]"
    )

    try:
        ipaddress.ip_address(
            candidate
        )

        return 1

    except ValueError:
        return 0


def count_subdomains(
    hostname: str,
) -> int:
    """
    Estimate the number of subdomain labels.

    Example:
        login.security.example.com
        -> 2
    """

    if not hostname:
        return 0

    if is_ip_address(
        hostname
    ):
        return 0

    labels = [
        label
        for label in hostname.split(".")
        if label
    ]

    return max(
        len(labels) - 2,
        0,
    )


def get_tld(
    hostname: str,
) -> str:
    """
    Return the final hostname label.

    This is a lightweight TLD approximation and does not perform
    public-suffix resolution.
    """

    if not hostname:
        return ""

    if is_ip_address(
        hostname
    ):
        return ""

    labels = [
        label
        for label in hostname.split(".")
        if label
    ]

    return (
        labels[-1]
        if labels
        else ""
    )


def count_keyword_matches(
    text: str,
    keywords: list[str] | tuple[str, ...] | set[str],
) -> int:
    """
    Count distinct keyword matches using case-insensitive substring matching.
    """

    normalized_text = (
        text or ""
    ).lower()

    return sum(
        1
        for keyword in keywords
        if str(keyword).strip().lower()
        and str(keyword).strip().lower()
        in normalized_text
    )


def extract_url_features(
    url: Any,
) -> dict[str, int | float]:
    """
    Normalize a URL and extract deterministic URL-based features.
    """

    normalized_url = (
        normalize_url_for_features(
            url
        )
    )

    parsed = urlsplit(
        normalized_url
    )

    hostname = (
        parsed.hostname
        or ""
    ).lower()

    path = parsed.path or "/"
    query = parsed.query or ""

    decoded_url = unquote(
        normalized_url
    )

    special_character_pattern = re.compile(
        r"[@_\-=?&#%]"
    )

    features: dict[
        str,
        int | float,
    ] = {
        "url_length": len(
            normalized_url
        ),
        "domain_length": len(
            hostname
        ),
        "path_length": len(
            path
        ),
        "query_length": len(
            query
        ),
        "num_dots": normalized_url.count(
            "."
        ),
        "num_hyphens": normalized_url.count(
            "-"
        ),
        "num_digits": sum(
            character.isdigit()
            for character
            in normalized_url
        ),
        "num_special_chars": len(
            special_character_pattern.findall(
                normalized_url
            )
        ),
        "num_subdomains": count_subdomains(
            hostname
        ),
        "tld_length": len(
            get_tld(
                hostname
            )
        ),
        "has_ip_address": is_ip_address(
            hostname
        ),
        "has_at_symbol": int(
            "@" in normalized_url
        ),
        "has_https": int(
            parsed.scheme == "https"
        ),
        "has_url_encoding": int(
            "%" in normalized_url
        ),
        "entropy": calculate_entropy(
            normalized_url
        ),
        "suspicious_keyword_count": (
            count_keyword_matches(
                decoded_url,
                SUSPICIOUS_KEYWORDS,
            )
        ),
        "brand_keyword_count": (
            count_keyword_matches(
                decoded_url,
                BRAND_KEYWORDS,
            )
        ),
    }

    return features