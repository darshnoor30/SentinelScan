import asyncio

import httpx

from src.api.main import app


def get(path: str) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get(path)

    return asyncio.run(request())


def test_root_describes_the_service() -> None:
    response = get("/")

    assert response.status_code == 200
    assert response.json()["application"] == "SentinelScan"
    assert response.json()["documentation"] == "/docs"


def test_health_endpoint_is_public() -> None:
    response = get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_protected_endpoint_rejects_missing_key() -> None:
    response = get("/history")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing API key"
