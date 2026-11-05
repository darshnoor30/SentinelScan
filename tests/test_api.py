import asyncio

import httpx
import pytest

from src.api.main import app
from src.api.schemas import URLScanRequest


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


@pytest.mark.parametrize("host", [
    "100.64.0.0", "100.64.0.1", "100.127.255.255",
    "127.0.0.1", "10.0.0.1", "169.254.169.254", "224.0.0.1",
    "[::1]", "[fe80::1]", "[ff02::1]",
])
def test_scan_request_rejects_non_public_ip_addresses(host: str) -> None:
    with pytest.raises(ValueError, match="non-public IP addresses"):
        URLScanRequest(url=f"https://{host}")


@pytest.mark.parametrize("host", [
    "8.8.8.8", "1.1.1.1", "[2606:4700:4700::1111]", "github.com",
])
def test_scan_request_accepts_public_addresses_and_domains(host: str) -> None:
    url = f"https://{host}"
    assert URLScanRequest(url=url).url == url
