"""
SentinelScan

Threat Intelligence Cache Layer
"""


class ThreatCache:

    def __init__(self):

        self.cache = {}


    def get(self, key):

        return self.cache.get(
            key
        )


    def set(self, key, value):

        self.cache[key] = value



threat_cache = ThreatCache()