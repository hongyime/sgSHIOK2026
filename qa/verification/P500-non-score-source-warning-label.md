# P500 Non-Score Source Warning Label

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

Readiness score-provenance warnings now include a readable label for known non-score reference source hashes while preserving structured key fields.

## Focused Test

```text
.                                                                        [100%]
1 passed in 7.02s
```

## Readiness Gate Summary Score-Provenance Output

```text
"scoring_fingerprint_status": {
  "blocking_provenance_signals": [],
  "expected_score_source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ],
  "incomplete_network_provenance": false,
  "incomplete_scoring_fingerprint_provenance": false,
  "incomplete_scoring_input_provenance": false,
  "legacy_missing_capabilities": [
    "full 18-file scoring fingerprint set",
    "record-level scoring fingerprint digests",
    "record-level scoring input provenance",
    "record-level network provenance"
  ],
  "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\generated_20260805_prefer_scored_routed\\manifest.json",
  "missing_expected_score_source_hashes": [],
  "missing_scoring_fingerprints": [
    "pipeline\\bus.py",
    "pipeline\\bus_arrivals.py",
    "pipeline\\connector_candidates.py",
    "pipeline\\export.py",
    "pipeline\\fetch.py",
    "pipeline\\geocode.py",
    "pipeline\\geocode_universe.py",
    "pipeline\\network.py",
    "pipeline\\osm_tags.py",
    "pipeline\\postal_universe.py",
    "pipeline\\score_batch.py",
    "pipeline\\shade.py",
    "run.py"
  ],
  "missing_subscore_status": [],
  "mixed_network_digests": false,
  "mixed_scoring_fingerprint_digests": false,
  "mixed_scoring_input_digests": false,
  "network_changed_during_run": false,
  "non_score_reference_source_hashes": [
    "leaf_area_index"
  ],
  "ok": true,
  "scoring_fingerprint_changed_during_run": false,
  "scoring_fingerprint_count": 5,
  "scoring_input_changed_during_run": false,
  "source_hash_count": 14,
  "source_hash_keys": [
    "bus_routes",
    "bus_services",
    "bus_stops",
    "covered_linkway",
    "leaf_area_index",
    "mrt_lrt_exits",
    "nparks_heritage_road_green_buffers",
    "nparks_heritage_trees",
    "nparks_nature_ways",
    "nparks_park_connector_loop",
    "nparks_tracks",
    "osm_extract",
    "overhead_bridge_underpass",
    "traffic_signals"
  ],
  "state": "legacy",
  "subscore_status_keys": [
    "access",
    "bus",
    "crossing",
    "heat",
    "rain"
  ],
  "unexpected_source_hashes": [
    "leaf_area_index"
  ],
  "warning": "active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence; non-score reference source hashes present: leaf_area_index (NParks Leaf Area Index)",
  "warning_provenance_signals": []
}
```

## FINDINGS

1. The readiness score-provenance warning already classified `leaf_area_index` as a non-score reference source hash, but the human warning named only the key.
2. Adding `NParks Leaf Area Index` to the warning makes the LAI caveat understandable while preserving structured `non_score_reference_source_hashes` and `unexpected_source_hashes` as key lists.

## DISAGREEMENTS

1. None.
