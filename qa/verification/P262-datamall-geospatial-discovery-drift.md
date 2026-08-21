# P262 DataMall geospatial discovery drift

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`
Date: 2026-08-21

## Command output

```text
> uv run python -c <sanitized DataMall geospatial discovery probe>
probe=datamall_geospatial_authenticated_discovery_sanitized
writes=none
Unauthenticated static discovery failed for CoveredLinkWay: Unauthenticated static prefix discovery failed for keyword: CoveredLinkWay. Falling back to Authenticated GeospatialWholeIsland API.
{"discovered_url_redacted": "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip", "discovery_status": "discovered", "key": "covered_linkway", "keyword": "CoveredLinkWay", "manifest_bytes": 1096785, "manifest_last_modified": "Sun, 26 Jul 2026 05:16:34 GMT", "manifest_url_redacted": "https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip", "matches_manifest_url_after_redaction": false}
Unauthenticated static discovery failed for PedestrainOverheadbridge_UnderPass: Unauthenticated static prefix discovery failed for keyword: PedestrainOverheadbridge_UnderPass. Falling back to Authenticated GeospatialWholeIsland API.
{"discovered_url_redacted": "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip", "discovery_status": "discovered", "key": "overhead_bridge_underpass", "keyword": "PedestrainOverheadbridge_UnderPass", "manifest_bytes": 478973, "manifest_last_modified": "Sun, 26 Jul 2026 05:16:34 GMT", "manifest_url_redacted": "https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip", "matches_manifest_url_after_redaction": false}
Unauthenticated static discovery failed for TrafficLight: Unauthenticated static prefix discovery failed for keyword: TrafficLight. Falling back to Authenticated GeospatialWholeIsland API.
{"discovered_url_redacted": "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip", "discovery_status": "discovered", "key": "traffic_signals", "keyword": "TrafficLight", "manifest_bytes": 1337159, "manifest_last_modified": "Fri, 06 Mar 2026 08:24:01 GMT", "manifest_url_redacted": "https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip", "matches_manifest_url_after_redaction": true}
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
> git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. DataMall authenticated geospatial discovery now resolves Covered Linkway and pedestrian overhead bridge/underpass to generic `dmgeospatial` S3 paths, while the frozen manifest records dated `Mar2026` static URLs.
2. Traffic signals still resolves to the same redacted base URL as the frozen manifest.
3. This is link-discovery drift, not proof of byte drift. The probe did not download source payloads, did not mutate `raw/manifest.json`, and did not create a new input version.
4. Any release batch that depends on refreshed LTA geospatial inputs needs an explicitly approved numbered v2 input probe; the frozen v1 files remain untouched.

## DISAGREEMENTS

1. None.
