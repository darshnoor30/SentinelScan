import pytest

from src.prediction.predictor import (
    clamp_percentage,
    load_components,
    normalize_url,
    to_float,
    to_int,
)


def test_normalize_url_adds_https_and_path() -> None:
    assert normalize_url("github.com") == "https://github.com/"


@pytest.mark.parametrize("url", ["", "ftp://example.com", "http://localhost"])
def test_normalize_url_rejects_unsupported_inputs(url: str) -> None:
    with pytest.raises(ValueError):
        normalize_url(url)


def test_numeric_helpers_fail_safely() -> None:
    assert to_int("7") == 7
    assert to_int("not-a-number") == 0
    assert to_float(float("nan")) == 0.0
    assert clamp_percentage(120) == 100.0
    assert clamp_percentage(-1) == 0.0


def test_committed_model_artifacts_load_with_the_runtime() -> None:
    model, preprocessor = load_components()

    assert hasattr(model, "predict")
    assert hasattr(model, "predict_proba")
    assert hasattr(preprocessor, "transform")
