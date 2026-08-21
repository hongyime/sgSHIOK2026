# P266 DataMall Discovery Source Policy

## Working Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence Path Ignore Check

```text
EXIT=1
```

## Change

Batch planning and production readiness now expose the P262/P264 DataMall geospatial discovery drift as structured source-policy data:

```json
{
  "measurement": "P262/P264 DataMall geospatial discovery-only probe",
  "command": "uv run python run.py check --geospatial-discovery-only",
  "payload_downloads": false,
  "manifest_writes": false,
  "changed_sources": ["covered_linkway", "overhead_bridge_underpass"],
  "matched_sources": ["traffic_signals"],
  "verdict": "changed discovery URLs require a new numbered input version, not an in-place repair"
}
```

## Focused Tests

Command:

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
```

Output:

```text
..................................                                       [100%]
34 passed in 91.84s (0:01:31)
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
EXIT=0
```

## FINDINGS

1. DataMall geospatial discovery drift was reproducible via CLI and documented in README, but not visible in the structured source-policy blocks used by dry-run batch planning and production readiness.
2. The structured policy now records the no-payload/no-manifest-write command, the two changed sources, the matching traffic-signals source, and the required versioned-input response.

## DISAGREEMENTS

1. None.
