# P210 Local Vercel Readiness

Date: 2026-08-21

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
2237cd5bd3bd7231017105f7576be89203c183f7
2237cd5bd3bd7231017105f7576be89203c183f7	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Pre-change Full Read-only Readiness Result

```text
scripts/production_readiness.py exited 1 after 448.672 seconds.
static_artifact_validation ok=true
static_artifact_validation file_count=4848
static_artifact_validation indexed_postals=124443
network ok=true
lamp_overlay ok=true
score_provenance state=legacy ok=true
onemap_validation same_bundle_fresh_gate_passed=false
onemap failing criteria=complete cache coverage, subset thresholds
final errors included:
Vercel project is not linked
Vercel root directory is not web
```

## Evidence Path Ignore Check

```text
exit=1
```

## Direct Local Vercel Readiness Probe

```text
{'linked': False, 'project_name': None, 'project_id': None, 'root_directory': None, 'root_directory_ok': None, 'local_config_ok': True, 'blocking': False, 'git_data_strategy': 'web build downloads configured bundle from production when local data is absent', 'root_link': {'linked': False, 'path': 'C:\\sgSHIOK2026\\.vercel\\project.json', 'payload': None}, 'web_link': {'linked': False, 'path': 'C:\\sgSHIOK2026\\web\\.vercel\\project.json', 'payload': None}, 'warnings': ['local Vercel project is not linked; production deploy still requires owner approval']}
```

## Post-change Real Active-bundle Readiness Probe

```text
[production-readiness] static artifacts: validated 2250/3453 geometry shards
[production-readiness] static artifacts: validated 2500/3453 geometry shards
[production-readiness] static artifacts: validated 2750/3453 geometry shards
[production-readiness] static artifacts: validated 3000/3453 geometry shards
[production-readiness] static artifacts: validated 3250/3453 geometry shards
[production-readiness] static artifacts: validated 3453/3453 geometry shards
[production-readiness] static artifacts: validated 114140 geometry records
[production-readiness] static artifacts: validating transit POI artifact
[production-readiness] auditing bundle state
[production-readiness] validating island network QA
[production-readiness] building dry-run batch plan
[production-readiness] checking Vercel, environment, source freshness, and lamp overlay
[production-readiness] checking bundle freshness and score provenance
[production-readiness] checking OneMap validation status
[production-readiness] summarizing feature policy
[production-readiness] readiness report complete
{
  "checks": {
    "infrastructure_readiness": true,
    "lamp_overlay_artifact": true,
    "onemap_validation_same_bundle_fresh": false,
    "onemap_validation_waived": false,
    "scoring_fingerprints": true,
    "state_counts_match_manifest": true,
    "static_artifact_validation": true,
    "vercel_root_directory": true
  },
  "errors": [],
  "ok": true,
  "release_gate_passed": false,
  "release_gate_status": "blocked",
  "unresolved_warnings": [
    "Vercel project is not linked in this local checkout",
    "source freshness warning: stale sources: nparks_heritage_road_green_buffers, nparks_heritage_trees, nparks_nature_ways, nparks_tracks, planning_area_boundary, traffic_signals; unknown_age sources: overture_addresses_sg_candidate",
    "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index",
    "latest cached 95,157-row OneMap walk validation failed: median abs delta 11.884% (max 12.0%), p95 abs delta 69.861% (max 100.0%), missing cache results 0, invalid cache results 62; failing criteria: complete cache coverage, subset thresholds; failing subsets: endpoint_connector, graph_routed_bus_stop, endpoint_connector_plausible_onemap_distance, graph_routed_bus_stop_plausible_onemap_distance"
  ],
  "vercel": {
    "blocking": false,
    "git_data_strategy": "web build downloads configured bundle from production when local data is absent",
    "linked": false,
    "local_config_ok": true,
    "project_id": null,
    "project_name": null,
    "root_directory": null,
    "root_directory_ok": null,
    "root_link": {
      "linked": false,
      "path": "C:\\sgSHIOK2026\\.vercel\\project.json",
      "payload": null
    },
    "warnings": [
      "local Vercel project is not linked; production deploy still requires owner approval"
    ],
    "web_link": {
      "linked": false,
      "path": "C:\\sgSHIOK2026\\web\\.vercel\\project.json",
      "payload": null
    }
  }
}
```

## Focused Tests

```text
................                                                [100%]
25 passed in 76.17s (0:01:16)
```

## Py Compile

```text
exit=0
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## Locked Weights Diff Check

```text
exit=0
```

## FINDINGS

1. The real production-readiness run no longer fails island network QA after P206; the remaining hard local infrastructure errors were Vercel link/root-directory checks from this checkout, not bundle integrity.
2. A missing local Vercel link should not make the artifact readiness report fail, because production deploy/repoint is already an owner-approved action and this task is not deploying.
3. An explicit linked Vercel project with a non-`web` root directory remains a blocking defect, because that is contradictory deploy configuration rather than absent local context.
4. The active bundle still remains release-gate blocked by the cached OneMap validation gate: cache coverage and subset thresholds fail. This change does not waive or hide that gate.

## DISAGREEMENTS

1. None.
