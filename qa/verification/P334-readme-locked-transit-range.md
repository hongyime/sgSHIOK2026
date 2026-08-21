# P334 README Locked Transit Range

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier README/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, or network build.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

README active-bundle onboarding changed from `beyond current transit range` to `beyond locked transit range`, matching the browser's locked-score availability copy.

## Verification

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_readme.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_readme.py ....                                                [100%]

============================== 4 passed in 1.42s ==============================
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

1. README active-bundle onboarding still used `beyond current transit range`; it now says `beyond locked transit range`, matching browser copy.
2. `tests/test_readme.py` now guards both the new wording and the absence of the old phrase.
3. This was free-tier documentation/test work: no scoring, export, rescore, subset run, ingest, network build, public data mutation, or locked-weight change.

## Disagreements

1. None.
