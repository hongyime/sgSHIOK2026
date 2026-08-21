# P268 Leaf Area Index Source Policy

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

Dry-run batch planning and production readiness now expose `leaf_area_index` in structured source-policy data as a non-score reference source:

```json
{
  "leaf_area_index": {
    "role": "source freshness reference table only",
    "reason": "species/generic LAI table; not route-level geometry or shade-proxy geometry",
    "score_provenance": "excluded from score source hashes",
    "promotion_requires": "separate species-located canopy inventory and approved model design"
  }
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
34 passed in 86.15s (0:01:26)
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

1. The Leaf Area Index policy was present in README/readiness prose and score-source hash checks, but not in the structured source-policy block used by dry-run batch planning and production readiness.
2. The structured policy now makes the settled decision machine-readable: `leaf_area_index` is source-freshness context only, not route geometry, shade-proxy geometry, or score provenance.

## DISAGREEMENTS

1. None.
