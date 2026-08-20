# P205 Readiness Oldest Current Source

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

`scripts/production_readiness.py` now reports the oldest still-current source freshness line as informational readiness context.

This aligns production readiness with `run.py check --freshness-only`, which already reports the oldest current source after P204. Current sources remain non-warning context; stale and unknown-age sources continue to produce the warning.

## Real Manifest Readiness Output

Command:

```text
uv run python -c "from scripts.production_readiness import source_freshness_readiness; r=source_freshness_readiness(); print(r['summary']); print(r['oldest_current_source']); print(r['warning'])"
```

Output:

```text
source freshness current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 112.5d of 120d threshold)
source freshness warning: stale sources: nparks_heritage_road_green_buffers, nparks_heritage_trees, nparks_nature_ways, nparks_tracks, planning_area_boundary, traffic_signals; unknown_age sources: overture_addresses_sg_candidate
```

## Verification

Command:

```text
uv run pytest C:\sgSHIOK2026\tests\test_production_readiness.py -q -p no:cacheprovider
```

Output:

```text
23 passed in 88.99s (0:01:28)
```

Command:

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py --help
```

Output excerpt:

```text
usage: production_readiness.py [-h] [--bundle-dir BUNDLE_DIR] [--mode MODE]
                               [--summary SUMMARY] [--universe UNIVERSE]
                               [--params PARAMS] [--qa QA] [--debug DEBUG]
                               [--waive-onemap-validation]
                               [--production-deploy-approved]
                               [--owner-approval-note OWNER_APPROVAL_NOTE]

Fast production-readiness report without scoring or deploying.
```

Command:

```text
uv run python C:\sgSHIOK2026\scripts\check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
exit=0
```

Command:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
exit=0
```

## Findings

1. Production readiness and `run.py check --freshness-only` were inconsistent after P204: the CLI reported the oldest current source, but readiness only returned current/stale/manual/unknown counts and warnings.
2. The oldest still-current source in the live local manifest is `leaf_area_index` at 112.5 days of a 120-day threshold.
3. Adding current-source details to readiness can accidentally promote current sources into warnings if warning construction iterates every `by_status` key; the implementation now explicitly excludes `current` from warning text.

## Disagreements

1. None.
