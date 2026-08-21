# P517 geospatial action output

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
a62f5c2419ce18dd31fc634905b9f706df25a471
a62f5c2419ce18dd31fc634905b9f706df25a471	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused test

Command:

```text
uv run pytest tests/test_fetch.py -q
```

Output:

```text
......................                                                   [100%]
22 passed in 8.50s
```

## Real discovery-only probe

Command:

```text
uv run python run.py check --geospatial-discovery-only | Select-String -Pattern "DataMall geospatial discovery|Geospatial discovery action|Discovery-only check|match="
```

Output:

```text
DataMall geospatial discovery check...
Discovery-only check: no payloads are downloaded and no manifest files are written.
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip 
discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=false 
manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip 
discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip 
discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 1, changed 2, errors 0
Geospatial discovery action: report and plan a new numbered input version; do not repair frozen v1 in place.
```

Exit code: 1, because the discovery-only report found changed discovery URLs.

## FINDINGS

1. The discovery-only report printed changed URL counts but did not tell the operator the release action.
2. Changed or errored discovery results now print an action line: report and plan a new numbered input version; do not repair frozen v1 in place.

## DISAGREEMENTS

1. None.
