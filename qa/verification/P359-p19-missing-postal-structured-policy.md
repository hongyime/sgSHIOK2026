# P359 P19 Missing-Postal Structured Policy

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Expose the exact cached P19 missing-postal lists in the structured batch-plan/readiness policy block, matching the P358 read-only cache-status command.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 34 items

tests\test_batch_plan.py .........                                       [ 26%]
tests\test_production_readiness.py .........................             [100%]

============================= 34 passed in 35.14s =============================
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT=0
```

### git diff -- pipeline/config/weights.yaml

```text
EXIT=0
```

## FINDINGS

1. P358 exposed exact cached P19 missing postals through `p19-gap-status`, but the structured batch-plan/readiness policy block still carried only the aggregate 8-of-976 count.

## DISAGREEMENTS

1. None.
