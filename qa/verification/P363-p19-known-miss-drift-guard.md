# P363 P19 Known-Miss Drift Guard

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Add a test guard so the browser's known P19 missing-postal mapping cannot drift from the structured `RECENT_PUBLIC_SOURCE_GAP_SAMPLE["missing_postals_by_source"]` policy block.

No runtime behavior change, scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### uv run pytest tests/test_batch_plan.py -p no:cacheprovider

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 10 items

tests\test_batch_plan.py ..........                                      [100%]

============================= 10 passed in 2.10s ==============================
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT=0
```

### git diff -- pipeline/config/weights.yaml

```text
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The same eight P19 missing postals now exist in both Python policy and TypeScript browser copy; without a cross-source guard, a future edit could update one side while silently leaving the other stale.

## DISAGREEMENTS

1. None.
