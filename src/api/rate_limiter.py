"""
Simple API Rate Limiter
"""


from time import time



requests = {}



MAX_REQUESTS = 20

WINDOW = 60




def check_rate_limit(
    client_ip
):


    current = time()


    if client_ip not in requests:

        requests[client_ip] = []


    requests[client_ip] = [

        t for t in requests[client_ip]

        if current - t < WINDOW

    ]



    if len(requests[client_ip]) >= MAX_REQUESTS:

        return False



    requests[client_ip].append(
        current
    )


    return True