# P128 Readiness OSM Coverage Fields

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Readiness Source Policy Output

```text
{"coverage_pct": 20.791045, "frozen_v1_postals": 124443, "measurement": "P125 live Overpass addr:postcode coverage", "overlap_frozen_v1_postals": 25873, "valid_distinct_postcodes": 25879, "verdict": "not sufficient as primary registry"}
```

## Focused Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 21 items

tests\test_production_readiness.py .....................                 [100%]

======================== 21 passed in 61.08s (0:01:01) ========================
```

## Integrity

```text
repo_integrity=ok
exit=0
```

## Weights Guard

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. Production readiness now exposes the P125 OSM `addr:postcode` measurement as structured release policy data: 25,879 valid distinct OSM postcodes, 25,873 overlapping frozen v1 postals, 124,443 frozen v1 postals, 20.791045% coverage, and verdict `not sufficient as primary registry`.
2. The structured readiness field reuses `pipeline.batch_plan.OSM_ADDR_POSTCODE_COVERAGE`, so batch planning and release readiness cannot drift silently on the OSM coverage numerator, denominator, percentage, or verdict.
3. This is reporting-only work. It does not alter inputs, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
