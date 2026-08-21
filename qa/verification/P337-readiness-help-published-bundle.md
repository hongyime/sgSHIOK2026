# P337 Readiness Help Published Bundle

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier runner help/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`run.py` safe-report help now says readiness validates the published shelter-map bundle and release gates without scoring or deploying.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 6 items

tests\test_run.py ......                                                 [100%]

============================== 6 passed in 1.21s ==============================
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

1. `run.py` safe-report help still said readiness validates the `current bundle`; it now names the published shelter-map bundle.
2. `tests/test_run.py` now guards both the new published-bundle wording and removal of the old current-bundle phrase.
3. This was free-tier operator-help/test work: no scoring, export, rescore, subset run, ingest, network build, readiness run, public data mutation, or locked-weight change.

## Disagreements

1. None.
