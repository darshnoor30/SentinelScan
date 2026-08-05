"""
SentinelScan Environment Test

Checks whether all major dependencies
are installed correctly.
"""


def test_environment():

    import pandas
    import numpy
    import sklearn
    import xgboost
    import lightgbm
    import shap

    assert pandas.__version__
    assert numpy.__version__
    assert sklearn.__version__
    assert xgboost.__version__
    assert lightgbm.__version__
    assert shap.__version__