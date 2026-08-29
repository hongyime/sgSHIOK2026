# P834 DataMall Discovery Policy Alignment

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Evidence Path Ignore Check

```text
git check-ignore -v qa/verification/P834-datamall-discovery-policy.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Pre-change Structured Policy

```text
uv run python -c "from pipeline.batch_plan import DATAMALL_GEOSPATIAL_DISCOVERY_POLICY; import json; print(json.dumps(DATAMALL_GEOSPATIAL_DISCOVERY_POLICY, indent=2, sort_keys=True))"
{
  "changed_sources": [
    "covered_linkway",
    "overhead_bridge_underpass"
  ],
  "checked_at_local_date": "2026-08-21",
  "command": "uv run python run.py check --geospatial-discovery-only",
  "manifest_writes": false,
  "matched_sources": [
    "traffic_signals"
  ],
  "measurement": "P262/P264 DataMall geospatial discovery-only probe",
  "payload_downloads": false,
  "verdict": "changed discovery URLs require a new numbered input version, not an in-place repair"
}
```

## Superseding Evidence

```text
Get-Content -LiteralPath 'C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md' -ErrorAction SilentlyContinue
# P682 DataMall Geospatial Discovery

Date: 2026-08-28
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

Scope:
- Run the safe DataMall geospatial discovery-only report for the geospatial sources called out by freshness policy.
- This did not run ingest, download payloads, write the raw manifest, score, export, rescore, build the network, deploy, or touch weights.

Command:

```text
uv run python run.py check --geospatial-discovery-only; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
DataMall geospatial discovery check...
Discovery-only check: no payloads are downloaded and no manifest files are written.
Unauthenticated static discovery failed for CoveredLinkWay: Unauthenticated static prefix discovery failed for keyword: CoveredLinkWay. Falling back to Authenticated GeospatialWholeIsland API.
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
Unauthenticated static discovery failed for PedestrainOverheadbridge_UnderPass: Unauthenticated static prefix discovery failed for keyword: PedestrainOverheadbridge_UnderPass. Falling back to Authenticated GeospatialWholeIsland API.
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
Unauthenticated static discovery failed for TrafficLight: Unauthenticated static prefix discovery failed for keyword: TrafficLight. Falling back to Authenticated GeospatialWholeIsland API.
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 3, changed 0, errors 0
exit=0
```

Follow-up guard:

```text
git diff -- raw processed web/public/data checksums.json pipeline/config/weights.yaml
```

Output:

```text
```

FINDINGS
1. The 28 Aug 2026 discovery-only check found no DataMall geospatial discovery URL drift for Covered Linkway, Pedestrian Overhead Bridge / Underpass, or Traffic Signals.
2. The check used the authenticated GeospatialWholeIsland fallback for all three keywords after unauthenticated static prefix discovery failed, but still downloaded no payloads and wrote no manifest files.

DISAGREEMENTS
1. None.
```

```text
Get-Content -LiteralPath 'C:\sgSHIOK2026\qa\verification\P750-readme-datamall-discovery-copy.md' -ErrorAction SilentlyContinue
# P750 README DataMall discovery copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Command output

```text
PS C:\sgSHIOK2026> rg -n "21 Aug|28 Aug|discovery-only|DataMall discovery|Covered Linkway|bridge/underpass|Traffic Signals|still match|differ from frozen" 'C:\sgSHIOK2026\decisions.md' 'C:\sgSHIOK2026\qa\verification' 'C:\sgSHIOK2026\README.md' 'C:\sgSHIOK2026\CLAUDE.md' 'C:\sgSHIOK2026\web\app\page.tsx' 'C:\sgSHIOK2026\web\lib\__tests__' 'C:\sgSHIOK2026\tests'
C:\sgSHIOK2026\web\app\page.tsx:109:  "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 discovery-only DataMall check found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1; stale payload ages still require a new numbered input version before any refresh.";
C:\sgSHIOK2026\README.md:94:newer upstream release exists. A 21 Aug 2026 metadata-only DataMall discovery
C:\sgSHIOK2026\README.md:95:check found current Covered Linkway and bridge/underpass discovery URLs differ
C:\sgSHIOK2026\README.md:96:from frozen v1, while traffic signals still matched. To rerun that
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:14:uv run python run.py check --geospatial-discovery-only; Write-Output "exit=$LASTEXITCODE"
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:23:[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:27:[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
C:\sgSHIOK2026\qa\verification\P682-datamall-geospatial-discovery.md:44:1. The 28 Aug 2026 discovery-only check found no DataMall geospatial discovery URL drift for Covered Linkway, Pedestrian Overhead Bridge / Underpass, or Traffic Signals.
C:\sgSHIOK2026\qa\verification\P683-ui-datamall-discovery-line.md:26:1. The UI still displayed the older 21 Aug 2026 DataMall discovery note saying Covered Linkway and bridge/underpass URLs differed from frozen v1. P682 superseded that with a 28 Aug 2026 discovery-only check showing Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.
```

## FINDINGS

1. README still described the superseded 21 Aug 2026 DataMall discovery drift result, while the browser and P682/P683 evidence use the later 28 Aug 2026 discovery-only result showing Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.
2. The refresh conclusion remains unchanged: stale payload ages still require a new numbered input version before refresh, and changed discovery URLs would still be a new-version trigger.

## DISAGREEMENTS

1. None.
```

## Post-change Structured Policy

```text
uv run python -c "from pipeline.batch_plan import DATAMALL_GEOSPATIAL_DISCOVERY_POLICY; import json; print(json.dumps(DATAMALL_GEOSPATIAL_DISCOVERY_POLICY, indent=2, sort_keys=True))"
{
  "changed_sources": [],
  "checked_at_local_date": "2026-08-28",
  "command": "uv run python run.py check --geospatial-discovery-only",
  "manifest_writes": false,
  "matched_sources": [
    "covered_linkway",
    "overhead_bridge_underpass",
    "traffic_signals"
  ],
  "measurement": "P682/P683/P750 DataMall geospatial discovery-only probe",
  "payload_downloads": false,
  "verdict": "discovery URLs still match frozen v1; stale payload ages still require a new numbered input version before any refresh"
}
```

## Tests

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py tests/test_readme.py -q
..........................................                               [100%]
42 passed in 110.56s (0:01:50)
```

## Protected Diff Guard

```text
git diff -- pipeline/config/weights.yaml raw processed web/public/data checksums.json qa/releases qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11
```

## FINDINGS

1. Batch-plan and production-readiness structured source policy still reported the superseded 21 Aug 2026 DataMall discovery drift after README, web copy, and P682/P683/P750 evidence had moved to the 28 Aug 2026 matched result.
2. The actual release policy did not become weaker: stale payload ages still require a new numbered input version before refresh, and any future changed discovery URL remains a new-version trigger.

## DISAGREEMENTS

1. None.
