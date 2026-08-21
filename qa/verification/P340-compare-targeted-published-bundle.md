# P340 Compare Targeted Published Bundle

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier operator help/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, targeted comparison run, targeted refresh run, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`run.py` and `scripts/compare_targeted_scores.py` now describe targeted comparison against the published shelter-map bundle.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py tests/test_compare_targeted_scores.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 19 items

tests\test_run.py .......                                                [ 36%]
tests\test_compare_targeted_scores.py ............                       [100%]

============================= 19 passed in 2.90s ==============================
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

## Findings

1. `run.py` still described `compare-targeted` against the generic `active bundle`; it now says published shelter-map bundle.
2. `scripts/compare_targeted_scores.py` still described the comparator target as the active static bundle; it now says published shelter-map bundle.
3. This was free-tier operator-help/test work: no scoring, export, rescore, subset run, ingest, network build, targeted comparison run, public data mutation, or locked-weight change.

## Disagreements

1. None.
