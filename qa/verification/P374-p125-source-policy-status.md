# P374 P125 source-policy status

## Root guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Batch-plan P125 source policy

```text
{
  "cache_status_calls_apis": false,
  "cache_status_command": "uv run python run.py p125-osm-status",
  "cache_status_writes_files": false,
  "coverage_pct": 20.791045,
  "frozen_v1_postals": 124443,
  "invalid_distinct_postcode_tags": 23,
  "measurement": "P125 live Overpass addr:postcode coverage",
  "overlap_frozen_v1_postals": 25873,
  "overpass_output_path": "qa/p125/overpass_sg_addr_postcode.json",
  "overpass_query_path": "qa/p125/overpass_sg_addr_postcode.query",
  "valid_distinct_postcodes": 25879,
  "verdict": "not sufficient as primary registry"
}
```

## Readiness P125 source policy

```text
{
  "cache_status_calls_apis": false,
  "cache_status_command": "uv run python run.py p125-osm-status",
  "cache_status_writes_files": false,
  "coverage_pct": 20.791045,
  "frozen_v1_postals": 124443,
  "invalid_distinct_postcode_tags": 23,
  "measurement": "P125 live Overpass addr:postcode coverage",
  "overlap_frozen_v1_postals": 25873,
  "overpass_output_path": "qa/p125/overpass_sg_addr_postcode.json",
  "overpass_query_path": "qa/p125/overpass_sg_addr_postcode.query",
  "valid_distinct_postcodes": 25879,
  "verdict": "not sufficient as primary registry"
}
```

## Focused tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 35 items

tests\test_batch_plan.py ..........                                      [ 28%]
tests\test_production_readiness.py .........................             [100%]

======================= 35 passed in 112.02s (0:01:52) ========================
```

## Batch-plan safe report

```text
uv run python run.py batch-plan
```

Exit code 0. The `source_policy.osm_addr_postcode_registry` block included the batch-plan P125 source policy shown above.

## Readiness safe report

```text
uv run python run.py readiness
```

Exit code 0. The `features.source_policy.osm_addr_postcode_registry` block included the readiness P125 source policy shown above. The overall release gate remains blocked by existing non-P125 issues.

## Repo integrity

```text
repo_integrity=ok
exit_code=0
```

## Weights guard

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. P373 made `p125-osm-status` runnable, but structured batch-plan and readiness output still exposed only the static P125 counts, not the safe status command or cached paths.
2. The shared P125 source-policy block now gives operators the exact no-API/no-write command, cached Overpass query/output paths, and 23 invalid distinct OSM postcode tag count wherever release policy is reported.

## DISAGREEMENTS

1. None.
