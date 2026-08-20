# P76 Source Freshness Readiness

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Evidence Trackability

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P76-source-freshness-readiness.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused Tests

```text
.....................                                                    [100%]
21 passed in 64.63s (0:01:04)
```

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

## Live Source Freshness Readiness

Command:

```text
uv run python -c "import json; from scripts.production_readiness import source_freshness_readiness; print(json.dumps(source_freshness_readiness(), indent=2, sort_keys=True))"
```

Output:

```json
{
  "by_status": {
    "stale": [
      "nparks_heritage_road_green_buffers",
      "nparks_heritage_trees",
      "nparks_nature_ways",
      "nparks_tracks",
      "planning_area_boundary",
      "traffic_signals"
    ],
    "unknown_age": [
      "overture_addresses_sg_candidate"
    ],
    "unknown_policy": []
  },
  "config_path": "C:\\sgSHIOK2026\\pipeline\\config\\sources.yaml",
  "counts": {
    "current": 12,
    "manual": 2,
    "stale": 6,
    "unknown_age": 1,
    "unknown_policy": 0
  },
  "manifest_path": "C:\\sgSHIOK2026\\raw\\manifest.json",
  "ok": true,
  "state": "reported",
  "summary": "source freshness current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1",
  "warning": "source freshness warning: stale sources: nparks_heritage_road_green_buffers, nparks_heritage_trees, nparks_nature_ways, nparks_tracks, planning_area_boundary, traffic_signals; unknown_age sources: overture_addresses_sg_candidate"
}
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py; "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## Diff And Weights Guard

Command:

```text
git diff --stat; git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
 scripts/production_readiness.py    | 126 +++++++++++++++++++++++++++++++++++++
 tests/test_production_readiness.py |  72 +++++++++++++++++++++
 2 files changed, 198 insertions(+)
```

## Findings

1. Production readiness previously omitted source freshness even though the project already had a manifest-only freshness policy; stale and unknown-age source status could stay hidden unless a separate fetch check was run.
2. The current local source manifest reports 12 current sources, 6 stale sources, 2 manual sources, and 1 unknown-age source.
3. Source freshness remains non-blocking release context in this change. Missing local source freshness inputs in a fresh clone do not become a release failure, while stale or unknown-age local metadata appears in unresolved warnings.

## Disagreements

1. None.
