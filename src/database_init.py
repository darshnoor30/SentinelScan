"""
Initialize SentinelScan Database
"""


from database.database import engine
from database.models import Base



def init_database():

    Base.metadata.create_all(
        bind=engine
    )


if __name__ == "__main__":

    init_database()

    print(
        "Database initialized successfully"
    )