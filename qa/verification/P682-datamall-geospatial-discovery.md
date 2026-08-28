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
