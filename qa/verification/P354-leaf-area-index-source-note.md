# P354 Leaf Area Index Source Note

## Scope

`pipeline/config/sources.yaml` now describes NParks Leaf Area Index as a tracked freshness reference table only, matching the README/readiness/batch-plan policy that it is not route-level geometry, shade-proxy geometry, score provenance, or rain shelter geometry.

## Commands

```text
uv run pytest tests/test_fetch.py -p no:cacheprovider
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
collected 20 items

tests\test_fetch.py ....................                                 [100%]

============================= 20 passed in 3.64s ==============================
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

## FINDINGS

1. `sources.yaml` still described `leaf_area_index` as a `shade/heat calibration source`, while the settled project policy says the species/generic LAI table is freshness-only reference metadata unless a separate located canopy model is designed.

## DISAGREEMENTS

1. None.
