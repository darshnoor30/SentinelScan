from src.feature_engineering.cache import (
    TTLCache
)



def test_cache():


    cache = TTLCache(
        ttl_seconds=60
    )


    cache.set(
        "google.com",
        {
            "age":100
        }
    )


    result = cache.get(
        "google.com"
    )


    assert result["age"] == 100