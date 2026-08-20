# P126 Readiness OSM Citation

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deployment, public data mutation, protected QA mutation, or weights.yaml edit was performed.
```

## Change

```text
Production readiness now cites P125, not P63, for the live OSM addr:postcode coverage measurement used in postal-universe policy copy.
```

## Validation

```text
uv run pytest tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 21 items

tests\test_production_readiness.py .....................                 [100%]

============================= 21 passed in 41.38s =============================

git check-ignore -v qa/verification/P126-readiness-osm-citation.md; "exit=$LASTEXITCODE"
exit=1

git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0

git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0

python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. Production-readiness policy copy still cited the older P63 OSM measurement even after P125 recorded a fresh live Overpass measurement with exact metadata and arithmetic.

## DISAGREEMENTS

1. None.
