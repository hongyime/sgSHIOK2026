# P127 Batch Plan OSM Coverage

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deployment, public data mutation, protected QA mutation, or weights.yaml edit was performed.
```

## Change

```text
pipeline.batch_plan source_policy now exposes P125 OSM addr:postcode coverage as structured fields: valid_distinct_postcodes, overlap_frozen_v1_postals, frozen_v1_postals, coverage_pct, and verdict.
```

## Validation

```text
uv run pytest tests/test_batch_plan.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 8 items

tests\test_batch_plan.py ........                                        [100%]

============================== 8 passed in 6.80s ==============================

git check-ignore -v qa/verification/P127-batch-plan-osm-coverage.md; "exit=$LASTEXITCODE"
exit=1

git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0

git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0

python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. The dry-run batch planner carried the OSM policy only as a prose insufficiency verdict, so future batch-review output did not show the measured P125 numerator, denominator, or coverage percentage.

## DISAGREEMENTS

1. None.
