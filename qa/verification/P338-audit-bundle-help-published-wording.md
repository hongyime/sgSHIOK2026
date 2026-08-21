# P338 Audit Bundle Help Published Wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier operator help/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, audit run, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`scripts/audit_current_bundle.py` now describes its default target as the published shelter-map bundle in CLI description and `--state-only` help.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_audit_current_bundle.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_audit_current_bundle.py .....                                 [100%]

============================== 5 passed in 5.55s ==============================
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

1. `scripts/audit_current_bundle.py --state-only` help still said `current bundle state counts`; it now names published shelter-map bundle state counts.
2. The audit helper CLI description now also says published shelter-map bundle, matching the readiness help wording.
3. This was free-tier operator-help/test work: no scoring, export, rescore, subset run, ingest, network build, audit run, readiness run, public data mutation, or locked-weight change.

## Disagreements

1. None.
