# P476 readiness gate summary

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier readiness operator usability only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Measurements

```text
PS C:\sgSHIOK2026> uv run python run.py check --freshness-only
Source freshness from raw/manifest.json at 2026-08-21T16:24:19.695104+00:00...
Manifest-only check: no upstream URLs were probed.
Freshness: current 12, stale 6, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)
Stale sources: traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers
Unknown-age sources: overture_addresses_sg_candidate
```

```text
PS C:\sgSHIOK2026> uv run python run.py readiness
[production-readiness] readiness report complete
...
"release_gate_passed": false
"release_gate_status": "blocked"
"onemap_validation_same_bundle_fresh": false
"source_freshness": current 12, stale 6, manual 2, unknown_age 1
"oldest_current_source": "Oldest current source: leaf_area_index (NParks Leaf Area Index, 113.4d of 120d threshold)"
```

The full readiness output is too large for routine operator review; it scanned 4,848 static JSON artifacts, 304 score shards, 3,453 geometry shards, 124,443 indexed score records, and 114,140 geometry records before emitting a full nested report.

```text
PS C:\sgSHIOK2026> uv run python -m scripts.production_readiness --help | Select-String -- '--gate-summary|Fast production-readiness'

                               [--production-deploy-approved] [--gate-summary]
Fast production-readiness report without scoring or deploying.
  --gate-summary        Print only the release gate verdict, checks, warnings,
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_production_readiness.py -q -p no:cacheprovider
..........................                                               [100%]
26 passed in 64.77s (0:01:04)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. The readiness report already contains the current gate answer, but the default CLI prints the entire nested report. That makes the practical release question harder to read than necessary. `--gate-summary` now prints the same computed release gate verdict, checks, warnings, and errors without changing any gate logic.

2. The current local readiness verdict remains blocked by the fresh same-bundle OneMap validation gate, not by static artifacts, score provenance, source freshness, lamp overlay, or infrastructure checks.

## DISAGREEMENTS

1. None.
