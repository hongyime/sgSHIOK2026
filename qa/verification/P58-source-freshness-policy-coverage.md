# P58 Source Freshness Policy Coverage Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P58 adds a regression test that every configured source resolves to an expected freshness cadence, and every non-manual source resolves to a numeric stale-after-days threshold.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Policy Inventory

```text
source_count 21
kinds ['datagov_polldownload', 'datamall_api_paginated', 'datamall_geospatial_listing', 'datamall_static_file', 'osm_pbf', 'overture_geoparquet_candidate']
building_points datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
bus_routes datamall_api_paginated {'expected_cadence': 'weekly', 'stale_after_days': 30}
bus_services datamall_api_paginated {'expected_cadence': 'weekly', 'stale_after_days': 30}
bus_stops datamall_api_paginated {'expected_cadence': 'weekly', 'stale_after_days': 30}
covered_linkway datamall_geospatial_listing {'expected_cadence': 'quarterly', 'stale_after_days': 120}
lamp_posts datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
leaf_area_index datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
mrt_lrt_exits datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
nparks_heritage_road_green_buffers datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
nparks_heritage_trees datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
nparks_nature_ways datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
nparks_park_connector_loop datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
nparks_tracks datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
osm_extract osm_pbf {'expected_cadence': 'manual', 'mode': 'manual'}
overhead_bridge_underpass datamall_geospatial_listing {'expected_cadence': 'quarterly', 'stale_after_days': 120}
overture_addresses_sg_candidate overture_geoparquet_candidate {'expected_cadence': 'monthly', 'stale_after_days': 45}
planning_area_boundary datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
sla_dwelling_information datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
traffic_signals datamall_geospatial_listing {'expected_cadence': 'quarterly', 'stale_after_days': 120}
train_station_codes datamall_static_file {'expected_cadence': 'manual', 'mode': 'manual'}
ura_no_dwelling_units datagov_polldownload {'expected_cadence': 'quarterly', 'stale_after_days': 120}
```

## Focused Fetch Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 15 items

tests\test_fetch.py ...............                                      [100%]

============================= 15 passed in 9.15s ==============================
EXIT_CODE=0
```

## Manifest Related Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 16 items

tests\test_fetch.py ...............                                      [ 93%]
tests\test_manifest_schema.py .                                          [100%]

============================= 16 passed in 9.12s ==============================
EXIT_CODE=0
```

## Full Python Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 348 items

tests\test_audit_current_bundle.py ....                                  [  1%]
tests\test_audited_shelter_corrections.py ..                             [  1%]
tests\test_batch_plan.py .......                                         [  3%]
tests\test_bus.py ...                                                    [  4%]
tests\test_bus_arrivals.py ...                                           [  5%]
tests\test_compare_targeted_scores.py ...........                        [  8%]
tests\test_connector_candidates.py ....                                  [  9%]
tests\test_diagnose_bus_connectors.py .........                          [ 12%]
tests\test_env.py ..                                                     [ 12%]
tests\test_export.py .............................                       [ 22%]
tests\test_fetch.py ...............                                      [ 27%]
tests\test_geocode_universe.py ...                                       [ 27%]
tests\test_hdb_void_deck_inference.py .............                      [ 31%]
tests\test_lamp_overlay.py ...                                           [ 32%]
tests\test_manifest_schema.py .                                          [ 32%]
tests\test_mayflower_qa_summary.py ....                                  [ 33%]
tests\test_network_preflight.py .....                                    [ 35%]
tests\test_network_qa.py .....                                           [ 36%]
tests\test_onemap_validation.py .........................                [ 43%]
tests\test_osm_tags.py ....                                              [ 45%]
tests\test_overture_addresses.py .....                                   [ 46%]
tests\test_partial_resnap_rescore.py ..                                  [ 47%]
tests\test_postal_universe.py ..........                                 [ 50%]
tests\test_production_readiness.py ................                      [ 54%]
tests\test_promote_audited_shelter_corrections.py ...                    [ 55%]
tests\test_publish.py ....                                               [ 56%]
tests\test_rebuild_network_debug.py ..                                   [ 57%]
tests\test_replay_onemap_outliers.py .........                           [ 59%]
tests\test_repo_integrity.py ......                                      [ 61%]
tests\test_route_feedback.py .....                                       [ 62%]
tests\test_routing.py ........                                           [ 65%]
tests\test_run.py .                                                      [ 65%]
tests\test_score_batch.py .......                                        [ 67%]
tests\test_scoring.py ...........                                        [ 70%]
tests\test_scoring_integration.py ...................................... [ 81%]
.........................                                                [ 88%]
tests\test_shade.py ......                                               [ 90%]
tests\test_shelter_skeleton.py ..                                        [ 91%]
tests\test_stub.py .                                                     [ 91%]
tests\test_targeted_bundle_refresh.py .........                          [ 93%]
tests\test_triage_onemap_outliers.py .....................               [100%]

======================= 348 passed in 185.14s (0:03:05) =======================
EXIT_CODE=0
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Diff Check

```text
DIFF_CHECK_EXIT=0
```

## Weights Diff

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. All 21 configured sources already resolve to a freshness policy, but this was not enforced by a regression test. A future source kind could have landed with `unknown_policy` freshness status.

## Disagreements

1. None.
