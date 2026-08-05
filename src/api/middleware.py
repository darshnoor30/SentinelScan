"""
SentinelScan Security Middleware
"""


from fastapi import Request
from fastapi.responses import JSONResponse

from src.api.rate_limiter import (
    check_rate_limit
)



async def security_middleware(
    request: Request,
    call_next
):


    client_ip = request.client.host



    allowed = check_rate_limit(
        client_ip
    )



    if not allowed:

        return JSONResponse(

            status_code=429,

            content={

                "error":
                "Too many requests"

            }

        )



    response = await call_next(
        request
    )


    return response