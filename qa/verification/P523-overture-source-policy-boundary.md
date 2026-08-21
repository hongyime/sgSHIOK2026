# P523 Overture source policy boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
31aeb2ab8c5e5f54e893513ce5753edd466e5168
31aeb2ab8c5e5f54e893513ce5753edd466e5168	refs/heads/main
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_fetch.py::test_source_config_has_freshness_policy_for_every_source tests/test_production_readiness.py::test_build_readiness_report_accepts_minimal_valid_current_state -q
```

Output:

```text
..                                                                       [100%]
2 passed in 10.00s
```

## Source config policy probe

Command:

```text
uv run python -c "from pathlib import Path; import yaml; config=yaml.safe_load(Path('pipeline/config/sources.yaml').read_text(encoding='utf-8')); print(config['sources']['overture_addresses_sg_candidate']['notes'])"
```

Output:

```text
Candidate-only postal-universe evidence. Overture addresses are Alpha; SG probe found 142,210 address rows, 123,883 unique six-digit postcodes, 1,687 new vs current universe, and 1,836 current postcodes missing from Overture. Archived coordinate candidate sha256 cded7259e2c1aedf9c2146d5ae4ae3fb107a6b37e3424257bca929eda20ab5ca; optional postal-universe probe produced 125,876 total postals and 1,671 Overture-only postcodes. Coordinate QA vs current universe found p50 1.4m, p95 23.5m, 482 postcodes over 100m, and 41 over 1km. Does not approve scoring or address-registry use; promote only after raw archive, attribution, dedupe, coordinate-outlier review, and owner approval.
```

## Interrupted broad probe

Command:

```text
uv run python -c "from scripts.production_readiness import build_readiness_report; print(build_readiness_report()['features']['not_incorporated']['overture_addresses_sg_candidate'])"
```

Result:

```text
Interrupted after exceeding a reasonable bound for this copy-only policy check. The fixture-backed readiness test above covers the changed readiness string without scanning the local bundle.
```

## FINDINGS

1. `pipeline/config/sources.yaml` still described Overture as a generic candidate QA/expansion source and ended with `Promote only after...`, without the newer no-scoring/no-registry boundary.
2. Production readiness still said Overture was `not active production until outlier review/rescore`, which could read as a pipeline-time blocker rather than a source-policy non-approval.
3. The source config and readiness feature note now both state that Overture is candidate-only postal-universe evidence and does not approve scoring or address-registry use.

## DISAGREEMENTS

1. None.
