"""
SentinelScan API Authentication
"""


from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader


from src.utils.config import API_KEY




api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False
)



def verify_api_key(
    api_key: str = Security(api_key_header)
):


    if not api_key:

        raise HTTPException(
            status_code=401,
            detail="Missing API key"
        )


    if api_key != API_KEY:

        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )


    return True