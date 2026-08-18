# Detection and Evaluation Methodology

## Dataset provenance

The recorded dataset version combines defensive URL feeds from PhishTank,
OpenPhish, URLhaus, and Tranco. `data/metadata/dataset_version.json` records the
split counts, sources, domain-based split strategy, and random seed. Generated
full datasets are deliberately excluded from Git; a small sample remains for
schema inspection.

## Feature contract

The deployed model consumes 31 features across URL structure, lexical behavior,
WHOIS/domain properties, DNS, and TLS. `src/feature_engineering/feature_schema.py`
is the source of truth for feature order. Training and inference must use that
same order to prevent silent schema drift.

## Evaluation boundaries

- The repository records experiment results from a domain-based holdout split.
- Metrics describe that snapshot, not guaranteed real-world performance.
- Feed overlap, changing attacker behavior, and source imbalance can inflate
  apparent performance even with domain-aware splitting.
- External-provider availability is not treated as proof of safety.
- False positives and false negatives remain possible; a verdict should support,
  not replace, analyst review.

## Reproducing experiments

```bash
python -m pip install -r requirements-ml.txt
python -m src.data_processing.prepare_dataset
python -m src.model_training.feature_dataset_builder
python -m src.model_training.train_models
```

Dataset collectors make network requests. Run them only in an authorized research
environment and review provider terms before redistributing feed contents.
