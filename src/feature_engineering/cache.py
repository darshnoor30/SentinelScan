"""
SentinelScan
Feature Cache System

Used for:
- WHOIS results
- DNS results
- SSL results
- Threat intelligence lookups
"""


import time



class TTLCache:
    """
    Simple time based cache.
    """

    def __init__(self, ttl_seconds=86400):

        self.cache = {}

        self.ttl_seconds = ttl_seconds



    def set(self, key, value):

        self.cache[key] = {

            "value": value,

            "timestamp": time.time()

        }



    def get(self, key):

        if key not in self.cache:

            return None



        item = self.cache[key]


        age = (
            time.time()
            -
            item["timestamp"]
        )


        if age > self.ttl_seconds:

            del self.cache[key]

            return None



        return item["value"]



    def clear(self):

        self.cache.clear()



# Global caches

whois_cache = TTLCache(
    ttl_seconds=86400
)


dns_cache = TTLCache(
    ttl_seconds=3600
)


ssl_cache = TTLCache(
    ttl_seconds=86400
)