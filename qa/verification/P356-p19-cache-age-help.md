# P356 P19 Cache-Age Help

## Scope

`run.py` help and README onboarding now state that `p19-gap-status` reports cached P19 measurement status and cache ages, while preserving the no-API/no-write boundary.

## Commands

```text
uv run pytest tests/test_run.py tests/test_readme.py -p no:cacheprovider
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
collected 11 items

tests\test_run.py .......                                                [ 63%]
tests\test_readme.py ....                                                [100%]

============================= 11 passed in 0.94s ==============================
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

## FINDINGS

1. P355 made `p19-gap-status` report cache ages, but the operator help and README still described it only as cached measurement status.

## DISAGREEMENTS

1. None.
