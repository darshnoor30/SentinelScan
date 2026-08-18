"""Verify only the dependencies required by the deployed application."""


def test_runtime_environment() -> None:
    import fastapi
    import joblib
    import numpy
    import pandas
    import pydantic
    import sklearn
    import sqlalchemy

    assert all(
        package.__version__
        for package in (fastapi, joblib, numpy, pandas, pydantic, sklearn, sqlalchemy)
    )
