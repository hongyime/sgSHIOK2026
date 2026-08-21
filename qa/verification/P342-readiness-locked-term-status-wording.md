# P342 Readiness Locked-Term Status Wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier readiness warning/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

Production readiness warnings now describe missing subscore-status provenance capability as missing locked-term status, while keeping the manifest field name `subscore_status`.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 25 items

tests\test_production_readiness.py .........................             [100%]

============================= 25 passed in 33.09s =============================
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

1. Production readiness still described missing `subscore_status` capability as incomplete component-score status.
2. The warning now says complete locked-term status while leaving the underlying manifest field name unchanged.
3. This was free-tier readiness warning/test work: no scoring, export, rescore, subset run, ingest, network build, readiness run, public data mutation, or locked-weight change.

## Disagreements

1. None.
