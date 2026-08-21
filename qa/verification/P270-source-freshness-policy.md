# P270 Source Freshness Policy

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

Dry-run batch planning and production readiness now expose the manifest-only source-freshness boundary in structured source-policy data:

```json
{
  "command": "uv run python run.py check --freshness-only",
  "scope": "manifest_only",
  "upstream_urls_probed": false,
  "writes_manifest": false,
  "role": "release context, not a corruption or hash-repair signal",
  "stale_result": "report and plan a versioned refresh; do not mutate frozen v1 in place"
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
34 passed in 68.20s (0:01:08)
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

1. Source freshness was available as a CLI command and production-readiness section, but the shared structured source-policy block did not encode the no-upstream-probe/no-manifest-write boundary.
2. Batch-plan and readiness consumers can now distinguish source freshness from a hash mismatch or an instruction to repair frozen v1.

## DISAGREEMENTS

1. None.
