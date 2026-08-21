# P357 P19 Cache-Age Structured Policy

## Scope

Batch-plan and production-readiness source-policy output now exposes `cache_status_reports_age_days: true` for the P19 recent public-source gap sample.

## Commands

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml
```

## Output

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 34 items

tests\test_batch_plan.py .........                                       [ 26%]
tests\test_production_readiness.py .........................             [100%]

============================= 34 passed in 33.90s =============================
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

## FINDINGS

1. P355/P356 made P19 cache ages available and discoverable through the runner and README, but the structured batch-plan/readiness policy block still only exposed the command and no-API/no-write safety flags.

## DISAGREEMENTS

1. None.
