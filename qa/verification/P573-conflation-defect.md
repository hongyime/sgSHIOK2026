# P573 Conflation Defect Quantification

## Scope

Quantified the DataMall bus-stop network conflation defect on a frozen 1200-record subset derived from the active published bundle `web/public/data/generated_20260805_prefer_scored_routed`.

No canonical scored-subset definition was found in `pipeline/score_batch.py` or `pipeline/config/params.yaml`; the subset was frozen as the first 1200 `state == "SCORED"` postals sorted ascending by postal from the published score shards. The frozen ID list is `qa/p573_subset_ids.json`.

No live OneMap or DataMall APIs were called. All inputs were local cached or published artifacts.

## Evidence

Commands run from `C:\sgSHIOK2026` with `PYTHONUTF8=1` before Python invocations:

| Command | Exit | Notes / output |
| --- | ---: | --- |
| `git -C 'C:\sgSHIOK2026' diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data` | 0 | Protected paths clean before housekeeping commit. |
| `git -C 'C:\sgSHIOK2026' add -- .agents/JOURNAL.md .agents/STATE.md; git -C 'C:\sgSHIOK2026' commit -m "docs: update agent state after P572"` | 0 | Housekeeping only, commit `11f16c4`. |
| `git -C 'C:\sgSHIOK2026' push origin main` | 0 | Pushed housekeeping commit. |
| `rg -n "subset|sample|limit" "C:\sgSHIOK2026\pipeline\score_batch.py" "C:\sgSHIOK2026\pipeline\config\params.yaml"` | 0 | Found only generic `--limit` and unrelated DBSCAN sample settings; no canonical frozen scored subset. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py bus-connector-diagnostics --help` | 0 | Printed top-level `run.py` help; task-specific help required module variant. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-triage --help` | 0 | Printed top-level `run.py` help; task-specific help required module variant. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-replay --help` | 0 | Printed top-level `run.py` help; task-specific help required module variant. |
| `$env:PYTHONUTF8='1'; uv run python -m scripts.diagnose_bus_connectors --help` | 0 | Confirmed explicit `--priority-geojson`, `--output`, and `--geojson-output` flags. |
| `$env:PYTHONUTF8='1'; uv run python -m scripts.triage_onemap_outliers --help` | 0 | Confirmed explicit JSON, GeoJSON, priority GeoJSON, validation-subset GeoJSON, and summary outputs. |
| `$env:PYTHONUTF8='1'; uv run python -m scripts.replay_onemap_outliers --help` | 0 | Confirmed explicit `--output` and `--confirm-outlier-replay` requirement. |
| `$env:PYTHONUTF8='1'; @'...bundle scan...'@ \| uv run python -` | 0 | Wrote `qa/p573_subset_ids.json`, `qa/p573_conflation/subset_measurement_summary.json`, `qa/p573_conflation/reason_histogram.json`, and `qa/p573_conflation/subset_validation_report.json`. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-replay --report C:\sgSHIOK2026\qa\p573_conflation\subset_validation_report.json --postal-universe C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet --network C:\sgSHIOK2026\processed\network_island.parquet --output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_replay_subset.json --limit 1200 --node-type bus_stop --direction project_longer_than_onemap --min-abs-pct-delta 0 --route-source-profile --confirm-outlier-replay` | 1 | Interrupted after no stdout/output in a bounded local run. No output JSON produced. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-replay --report C:\sgSHIOK2026\qa\p573_conflation\subset_validation_report.json --postal-universe C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet --network C:\sgSHIOK2026\processed\network_island.parquet --output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_replay_subset.json --limit 1200 --node-type bus_stop --direction project_longer_than_onemap --min-abs-pct-delta 0 --confirm-outlier-replay` | 1 | Interrupted after no stdout/output in a bounded local run. No output JSON produced. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-replay --report C:\sgSHIOK2026\qa\p573_conflation\subset_validation_report.json --postal-universe C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet --network C:\sgSHIOK2026\processed\network_island.parquet --output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_replay_subset_limit20.json --limit 20 --node-type bus_stop --direction project_longer_than_onemap --min-abs-pct-delta 0 --confirm-outlier-replay` | 1 | Interrupted after no stdout/output in a bounded local run. No output JSON produced. |
| `$env:PYTHONUTF8='1'; @'...frozen replay-shaped profile...'@ \| uv run python -` | 0 | Wrote `qa/p573_conflation/frozen_subset_replay_profile.json`; score shards lacked start/end coordinates, so geometry fields are null. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py onemap-outlier-triage --longer-profile C:\sgSHIOK2026\qa\p573_conflation\frozen_subset_replay_profile.json --shorter-profile C:\sgSHIOK2026\qa\p573_conflation\frozen_subset_replay_profile.json --validation-report C:\sgSHIOK2026\qa\p573_conflation\subset_validation_report.json --output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_triage_subset.json --geojson-output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_triage_subset.geojson --missing-bus-priority-geojson-output C:\sgSHIOK2026\qa\p573_conflation\missing_bus_priority_subset.geojson --overpermissive-priority-geojson-output C:\sgSHIOK2026\qa\p573_conflation\overpermissive_priority_subset.geojson --validation-subset-priority-geojson-output C:\sgSHIOK2026\qa\p573_conflation\validation_subset_priority_subset.geojson --validation-subset-priority-subset plausible_onemap_distance --validation-subset-priority-limit 1200 --summary-output C:\sgSHIOK2026\qa\p573_conflation\onemap_outlier_triage_subset_summary.json` | 0 | Wrote triage outputs under `qa/p573_conflation/`; missing-bus queue count 157, strict priority count 153. |
| `$env:PYTHONUTF8='1'; uv run python C:\sgSHIOK2026\run.py bus-connector-diagnostics --priority-geojson C:\sgSHIOK2026\qa\p573_conflation\missing_bus_priority_subset.geojson --postal-universe C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet --network C:\sgSHIOK2026\processed\network_island.parquet --output C:\sgSHIOK2026\qa\p573_conflation\bus_connector_diagnostics_subset.json --geojson-output C:\sgSHIOK2026\qa\p573_conflation\bus_connector_diagnostics_subset.geojson --transit-type bus_stop` | 1 | Interrupted after no stdout/output in a bounded local run. The input priority GeoJSON was empty because the frozen score shards lacked start/end coordinates. |
| `git -C 'C:\sgSHIOK2026' diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data` | 0 | Protected paths clean after diagnostics. |

Output paths:

- `qa/p573_subset_ids.json`
- `qa/p573_conflation/reason_histogram.json`
- `qa/p573_conflation/subset_measurement_summary.json`
- `qa/p573_conflation/subset_validation_report.json`
- `qa/p573_conflation/frozen_subset_replay_profile.json`
- `qa/p573_conflation/onemap_outlier_triage_subset.json`
- `qa/p573_conflation/onemap_outlier_triage_subset_summary.json`
- `qa/p573_conflation/onemap_outlier_triage_subset.geojson`
- `qa/p573_conflation/missing_bus_priority_subset.geojson`
- `qa/p573_conflation/overpermissive_priority_subset.geojson`
- `qa/p573_conflation/validation_subset_priority_subset.geojson`

## Findings

Subset count: 1200 `SCORED` rows from 95,157 scored rows in the frozen bundle.

Affected row-level bus-zero count: 208 of 1200, 17.333 percent.

Reason-string histogram among affected rows:

| Reason | Count | Share of affected |
| --- | ---: | ---: |
| `implausible_graph_route_to_datamall_bus_stop_within_direct_radius` | 154 | 74.038% |
| `none` | 51 | 24.519% |
| `dominant_unrouted_bus_endpoint_and_access_connectors` | 1 | 0.481% |
| `large_unrouted_bus_stop_access_connector` | 1 | 0.481% |
| `low_trust_bus_stop_road_centerline_route` | 1 | 0.481% |

Nearest-direct distribution among affected rows:

| Bin | Count |
| --- | ---: |
| missing | 51 |
| 0-60 m | 0 |
| 60-125 m | 63 |
| 125-250 m | 89 |
| 250-305 m | 5 |
| 305-400 m | 0 |
| 400+ m | 0 |

The dominant-reason shape reproduces: the implausible graph-route reason is the largest bucket by a wide margin. The P4 250-305 m band pattern does not reproduce on this sorted-first 1200 subset: only 5 of 208 affected rows are in the 250-305 m band, 2.404 percent of affected rows. Within the dominant implausible reason, 5 of 154 rows are in the 250-305 m band, 3.247 percent.

New defect shape observed: 51 affected rows have `subscores.bus == 0` but no `provenance.direct_bus_fallback.reason`; in this subset those rows cluster as MRT/LRT best-transit rows where the row-level bus subscore is zero but no bus fallback reason is present in the row provenance.

Triage on the frozen replay-shaped profile produced 157 `missing_bus_connector` review assignments, 153 strict missing-bus priority rows, and 518 total non-mutually-exclusive review assignments. This agrees with the histogram that the unresolved connector defect is concentrated in direct bus fallback / untrusted bus route cases.

## Disagreements

The QA happy-check expectation said `reason_histogram.json` should show the implausible graph-route reason dominating with material mass in the 250-305 m nearest-direct band. The dominance condition is satisfied. The material 250-305 m band condition is not satisfied for the canonical fallback subset used here, sorted-first 1200 scored postals from the active published bundle.

`onemap-outlier-replay` could not complete in bounded local runs on the subset-filtered report, even with `--limit 20`; those attempts were interrupted and recorded with exit code 1. This was not a missing cached artifact condition: `processed/postal_universe_candidate_full_registered_geocoded.parquet`, `processed/network_island.parquet`, and the local validation report all existed.

`bus-connector-diagnostics` also could not complete in a bounded local run. Its explicit priority GeoJSON input was empty because the frozen score shards do not carry start/end coordinates, so triage could not emit line features for connector inspection from the frozen subset alone.
