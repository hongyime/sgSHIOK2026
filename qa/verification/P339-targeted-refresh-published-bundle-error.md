# P339 Targeted Refresh Published Bundle Error

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier operator error/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, targeted refresh run, audit run, readiness run, or deploy.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`scripts/targeted_bundle_refresh.py` now reports absent selected postals against the published shelter-map bundle instead of the current bundle.

## Verification

First focused test run caught a missing `Path` import in the new static guard:

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_targeted_bundle_refresh.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 10 items

tests\test_targeted_bundle_refresh.py ....F.....                         [100%]

================================== FAILURES ===================================
___ test_targeted_bundle_refresh_absent_postal_error_names_published_bundle ___

    def test_targeted_bundle_refresh_absent_postal_error_names_published_bundle():
>       source = Path("scripts/targeted_bundle_refresh.py").read_text(encoding="utf-8")
                 ^^^^
E       NameError: name 'Path' is not defined

tests\test_targeted_bundle_refresh.py:56: NameError
=========================== short test summary info ===========================
FAILED tests/test_targeted_bundle_refresh.py::test_targeted_bundle_refresh_absent_postal_error_names_published_bundle
========================= 1 failed, 9 passed in 2.69s =========================
```

After adding the missing import:

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_targeted_bundle_refresh.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 10 items

tests\test_targeted_bundle_refresh.py ..........                         [100%]

============================= 10 passed in 1.99s ==============================
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

1. `scripts/targeted_bundle_refresh.py` still reported absent selected postals against the `current bundle`; it now names the published shelter-map bundle.
2. `tests/test_targeted_bundle_refresh.py` now guards the published-bundle error wording and rejects the old phrase.
3. This was free-tier operator-error/test work: no scoring, export, rescore, subset run, ingest, network build, targeted refresh run, public data mutation, or locked-weight change.

## Disagreements

1. None.
