# P567 Baseline Safe Reports

Working root: C:\sgSHIOK2026
Date: 2026-08-25

## Scope

Baseline safe-report capture only. No scoring, export, rescore, subset run, ingest, network build, deployment, protected data mutation, or locked-weight changes.

## Evidence

Task A ran the requested baseline commands sequentially with stdout and stderr redirected into `qa\p567_baseline`.

```text
cmd_a: uv run python run.py readiness --gate-summary > qa\p567_baseline\gate_summary.txt 2>&1
EXIT=0
```

```text
cmd_b: uv run python run.py check --freshness-only > qa\p567_baseline\freshness.txt 2>&1
EXIT=0
```

```text
cmd_c: uv run python run.py check --geospatial-discovery-only > qa\p567_baseline\discovery.txt 2>&1
EXIT=1
```

```text
cmd_d: uv run python run.py universe-status > qa\p567_baseline\universe_status.txt 2>&1
EXIT=0
key verdict lines:
  "decision_boundary": "Use these cached measurements to size the frozen-v1 address-universe gap before building postal-universe v2. They do not approve a v2 promotion, scoring, export, or input mutation.",
  "mode": "universe_measurement_status",
  "will_call_apis": false,
```

```text
cmd_e: uv run python run.py batch-plan > qa\p567_baseline\batch_plan.txt 2>&1
EXIT=0
key verdict lines:
    "ready_for_api_collection": true,
    "full_batch_allowed_now": false,
    "status": "approved_in_principle_not_approved_to_run"
```

## Disagreements

```text
DataMall geospatial discovery check...
Discovery-only check: no payloads are downloaded and no manifest files are written.
Unauthenticated static discovery failed for CoveredLinkWay: Unauthenticated static prefix discovery failed for keyword: CoveredLinkWay. Falling back to Authenticated GeospatialWholeIsland API.
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
Unauthenticated static discovery failed for PedestrainOverheadbridge_UnderPass: Unauthenticated static prefix discovery failed for keyword: PedestrainOverheadbridge_UnderPass. Falling back to Authenticated GeospatialWholeIsland API.
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
Unauthenticated static discovery failed for TrafficLight: Unauthenticated static prefix discovery failed for keyword: TrafficLight. Falling back to Authenticated GeospatialWholeIsland API.
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 1, changed 2, errors 0
Geospatial discovery action: report and plan a new numbered input version; do not repair frozen v1 in place.
```

Orchestrator ruling 2026-08-25

```text
cmd_c exited 1 intentionally: the DataMall geospatial discovery check requires action when manifest URLs drift from discovered S3 URLs. Its output showed matched 1, changed 2, errors 0, affecting covered_linkway and overhead_bridge_underpass; the approved plan already scopes those into Wave 1 versioned refreshes. The baseline freshness shape matches the decisions.md P76 expectation of current 12, stale 6, manual 2, unknown_age 1. No report code was modified. Wave 0 proceeds, and the drift is resolved by the planned P571 ingest and P572 verification.
```
