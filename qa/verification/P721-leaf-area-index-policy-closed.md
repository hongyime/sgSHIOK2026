# P721 Leaf Area Index Policy Closed

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Zero pipeline-cost verification. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change was performed.

## Code Inspection

`pipeline.scoring_integration.build_provenance()` builds per-record `source_hashes` only from `SCORE_PROVENANCE_SOURCE_HASH_KEYS`.

```text
    return {
        "manifest": "raw/manifest.json",
        "source_hashes": {
            key: value.get("sha256")
            for key, value in sources.items()
            if key in SCORE_PROVENANCE_SOURCE_HASH_KEYS
        },
```

The same provenance builder labels heat as the sparse spatial NParks geometry proxy when any `HEAT_SPATIAL_SOURCE_KEYS` source is present. It does not use NParks Leaf Area Index as route geometry, shade-proxy geometry, or score evidence.

## Measured Key Set

```text
source_hash_key_count= 13
leaf_area_index_in_source_hash_keys= False
heat_spatial_source_keys= ['nparks_heritage_road_green_buffers', 'nparks_heritage_trees', 'nparks_nature_ways', 'nparks_park_connector_loop', 'nparks_tracks']
source_hash_keys= ['bus_routes', 'bus_services', 'bus_stops', 'covered_linkway', 'mrt_lrt_exits', 'nparks_heritage_road_green_buffers', 'nparks_heritage_trees', 'nparks_nature_ways', 'nparks_park_connector_loop', 'nparks_tracks', 'osm_extract', 'overhead_bridge_underpass', 'traffic_signals']
```

## Focused Test

```text
.                                                                        [100%]
1 passed in 17.96s
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The Leaf Area Index orphan is already closed for future score provenance: `leaf_area_index` is not in `SCORE_PROVENANCE_SOURCE_HASH_KEYS` and is not emitted by `build_provenance()` source hashes.
2. Heat/shade score provenance is tied to the five spatial NParks geometry proxy keys, not to Leaf Area Index.
3. The remaining LAI appearances are freshness/reference/legacy-warning surfaces, not future score-evidence inputs.

## DISAGREEMENTS

1. The standing objective still says Leaf Area Index is hashed into 124,443 published records and consumed by nothing, then asks to wire it into shade proxy or stop hashing it in. That was true for the legacy published bundle, but the current code has already chosen the correct future policy: stop hashing it in score provenance while retaining it as a freshness-only reference.
