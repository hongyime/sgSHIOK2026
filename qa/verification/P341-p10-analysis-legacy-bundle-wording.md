# P341 P10 Analysis Legacy Bundle Wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier analysis-script wording/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, P10 analysis run, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

P10 analysis helper wording now refers to the pre-provenance release as the legacy published bundle rather than the active bundle.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_analysis_scripts.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 3 items

tests\test_analysis_scripts.py ...                                       [100%]

============================== 3 passed in 2.39s ==============================
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

1. `scripts/analysis/p10_coordinate_identity.py` still called the P10 comparison target the active bundle; it now says legacy published bundle.
2. `scripts/analysis/p10_provenance_coverage.py` still described postal-universe and network identity as path-only in the active bundle; it now says path-only in the legacy published bundle.
3. This was free-tier analysis-script wording/test work: no scoring, export, rescore, subset run, ingest, network build, P10 analysis run, public data mutation, or locked-weight change.

## Disagreements

1. None.
