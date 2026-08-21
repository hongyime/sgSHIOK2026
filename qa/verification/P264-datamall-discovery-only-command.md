# P264 DataMall Discovery-Only Command

## Working Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence Path Ignore Check

```text
EXIT=1
```

## Focused Test

Command:

```text
uv run pytest tests/test_fetch.py -q
```

Output:

```text
....................                                                     [100%]
20 passed in 3.62s
```

## Real Discovery-Only Probe

Command:

```text
uv run python run.py check --geospatial-discovery-only
```

Output:

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
```

Exit code: `1`

## FINDINGS

1. The P262 DataMall geospatial link-drift probe is now reproducible through a zero-mutation command: `uv run python run.py check --geospatial-discovery-only`.
2. The command reports discovery drift for `covered_linkway` and `overhead_bridge_underpass`, while `traffic_signals` still matches.
3. The command sanitizes signed DataMall S3 URLs before printing and before comparison, so no `X-Amz-*` credentials are exposed in evidence.
4. The command exits nonzero when a source's current discovery URL differs from the manifest URL, making the drift machine-checkable without downloading payloads or writing `raw/manifest.json`.

## DISAGREEMENTS

1. None.
