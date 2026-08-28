# P767 legacy rescope retirement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Retire `pipeline.rescope` as a direct legacy entrypoint because it performed OSM/HDB raw-data reads at import time from `Path("raw")`.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
git status --short
uv run pytest tests/test_legacy_geocode.py -q
uv run pytest -q --collect-only
python scripts/check_repo_integrity.py
git diff --stat
git diff -- pipeline/rescope.py tests/test_legacy_geocode.py decisions.md qa/verification/P767-rescope-retired.md
```

## FINDINGS

1. `pipeline/rescope.py` was still an unsafe legacy module: importing or running it immediately read `raw/` through a relative path, loaded `pyrosm`, extracted `addr:postcode` OSM data, read HDB building points, and printed counts without any owner confirmation or C:\ root guard.
2. The maintained path for this evidence is not a new extraction: cached `p125-osm-status` and `universe-status` already report OSM postcode and postal-universe status without API calls or writes.

## DISAGREEMENTS

1. None for this slice.
