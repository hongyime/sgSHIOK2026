# P572 Post-Refresh Freshness Verification

## Scope

Verify post-refresh source freshness and geospatial discovery after P571 native ingest for these eight keys:

- `traffic_signals`
- `planning_area_boundary`
- `nparks_nature_ways`
- `nparks_tracks`
- `nparks_heritage_trees`
- `nparks_heritage_road_green_buffers`
- `covered_linkway`
- `overhead_bridge_underpass`

This task did not ingest sources, mutate raw data, backdate manifest fields, rebuild public artifacts, or touch scoring weights.

## Evidence

Command:

```powershell
uv run python run.py check --freshness-only > qa\p572_post_refresh\freshness.txt 2>&1
```

Exit code: 0

Command:

```powershell
uv run python run.py check --geospatial-discovery-only > qa\p572_post_refresh\discovery.txt 2>&1
```

Exit code: 0

Freshness output key lines:

```text
[covered_linkway] Covered Linkway: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)
[traffic_signals] Traffic Signals: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 263.4d exceeds 120d threshold by 143.4d (quarterly)
[leaf_area_index] NParks Leaf Area Index: freshness current — last_modified age 117.2d within 120d threshold with 2.8d until stale (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 131.4d exceeds 120d threshold by 11.4d (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 243.4d exceeds 120d threshold by 123.4d (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 146.4d exceeds 120d threshold by 26.4d (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 205.4d exceeds 120d threshold by 85.4d (quarterly)
Freshness: current 10, stale 8, manual 2, unknown_policy 0, unknown_age 1
Oldest current source: leaf_area_index (NParks Leaf Area Index, 117.2d of 120d threshold, 2.8d until stale)
Stale sources: covered_linkway (Covered Linkway), overhead_bridge_underpass (Pedestrian Overhead Bridge / Underpass), traffic_signals (Traffic Signals), planning_area_boundary (Planning Area Boundaries (MP2019 No Sea)), nparks_nature_ways (NParks Nature Ways), nparks_tracks (NParks Tracks), nparks_heritage_trees (NParks Heritage Trees), nparks_heritage_road_green_buffers (NParks Heritage Road Green Buffers)
```

Discovery output key lines:

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
```

P571 proof attached:

- `traffic_signals`: P571 native ingest exited 0 and returned 304 unchanged.
- `planning_area_boundary`: P571 native ingest exited 0 and returned 304 unchanged.
- `nparks_nature_ways`: P571 native ingest exited 0 and returned 304 unchanged.
- `nparks_tracks`: P571 native ingest exited 0 and returned 304 unchanged.
- `nparks_heritage_trees`: P571 native ingest exited 0 and returned 304 unchanged.
- `nparks_heritage_road_green_buffers`: P571 native ingest exited 0 and returned 304 unchanged.
- `covered_linkway`: P571 native ingest exited 0; downloaded content hashed to existing `d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee`.
- `overhead_bridge_underpass`: P571 native ingest exited 0; downloaded content hashed to existing `bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444`.

## Findings

| Key | Post-refresh line | Classification |
| --- | --- | --- |
| `traffic_signals` | `[traffic_signals] Traffic Signals: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `planning_area_boundary` | `[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 263.4d exceeds 120d threshold by 143.4d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `nparks_nature_ways` | `[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 131.4d exceeds 120d threshold by 11.4d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `nparks_tracks` | `[nparks_tracks] NParks Tracks: STALE — last_modified age 243.4d exceeds 120d threshold by 123.4d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `nparks_heritage_trees` | `[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 146.4d exceeds 120d threshold by 26.4d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `nparks_heritage_road_green_buffers` | `[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 205.4d exceeds 120d threshold by 85.4d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `covered_linkway` | `[covered_linkway] Covered Linkway: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |
| `overhead_bridge_underpass` | `[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: STALE — last_modified age 172.2d exceeds 120d threshold by 52.2d (quarterly)` | `STALE_BASIS_LAST_MODIFIED_WITH_304_PROOF` |

`leaf_area_index` watch verdict: current age is 117.2d. It has not crossed the 120d threshold since the 116.9d baseline. It is now 2.8d from stale; per plan, refresh it in a follow-up task if it crosses the threshold. This task did not ingest it.

## Disagreements

All eight target keys still appear stale in the manifest-only freshness report because their age basis is upstream `last_modified`. P571 proves refreshed content currency without a new upstream timestamp: six sources returned 304 unchanged, and the two DataMall drift keys downloaded bytes that hashed to existing content-addressed directories.

Readiness gates or dashboards that consume manifest-only stale status may still flag these eight keys until the gate learns the verified-unchanged basis caveat or upstream publishes newer `last_modified` metadata. This evidence does not backdate or override manifest freshness fields.
