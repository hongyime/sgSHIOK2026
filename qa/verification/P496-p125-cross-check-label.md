# P496 P125 Cross-Check Label

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

The P125 structured `measurement` label now says `P125 20 Aug 2026 Overpass addr:postcode coverage cross-check`.

This keeps the machine-readable status aligned with the settled release policy: OSM addr:postcode data is geometry evidence and a coverage cross-check, not the address registry.

## Command Output

```text
{
  "coverage": {
    "osm_coverage_of_v1_pct": 20.791045,
    "osm_only_sample": [
      "289916",
      "289917",
      "289918",
      "289919",
      "289920",
      "519454"
    ],
    "osm_valid_distinct_postcodes": 25879,
    "osm_valid_in_v1": 25873,
    "osm_valid_not_in_v1": 6,
    "registry_policy": "not the address registry",
    "source_role": "geometry evidence and coverage cross-check",
    "v1_distinct_postals": 124443,
    "v1_not_in_osm_valid": 98570,
    "v1_only_sample": [
      "000104",
      "000105",
      "000106",
      "000135",
      "000207",
      "000208",
      "000315",
      "000316",
      "000511",
      "000512",
      "000617",
      "000718",
      "000719",
      "000820",
      "000821",
      "000922",
      "000923",
      "001024",
      "001025",
      "001026",
      "001027",
      "001130",
      "001232",
      "001233",
      "001334",
      "001438",
      "001439",
      "001441",
      "001542",
      "001543",
      "001648",
      "001750",
      "001781",
      "001953",
      "001954",
      "001955",
      "002262",
      "002367",
      "002469",
      "002677",
      "002880",
      "018907",
      "018910",
      "018925",
      "018926",
      "018927",
      "018928",
      "018929",
      "018930",
      "018937"
    ],
    "verdict": "not sufficient as primary Singapore address registry"
  },
  "files": {
    "overpass_output": {
      "addr_postcode_values": 32250,
      "age_days": 1.194,
      "bytes": 10748837,
      "distinct_addr_postcode_all": 25902,
      "exists": true,
      "invalid_distinct_count": 23,
      "invalid_distinct_sample": [
        "#B1-42",
        "01-01",
        "01-05",
        "135",
        "18983",
        "228232;228239",
        "2395661",
        "48618",
        "49406",
        "500003;500002",
        "50336",
        "510222;510221;510223",
        "52082",
        "59443",
        "59815",
        "62864",
        "769666,769668",
        "80739",
        "81005",
        "82001"
      ],
      "mtime_utc": "2026-08-20T13:46:41.503966+00:00",
      "overpass_elements": 32250,
      "overpass_elements_by_type": {
        "node": 6584,
        "relation": 525,
        "way": 25141
      },
      "path": "qa/p125/overpass_sg_addr_postcode.json",
      "valid_distinct_postcodes": 25879
    },
    "overpass_query": {
      "age_days": 1.194,
      "bytes": 188,
      "exists": true,
      "mtime_utc": "2026-08-20T13:46:16.941574+00:00",
      "path": "qa/p125/overpass_sg_addr_postcode.query"
    },
    "v1_universe": {
      "age_days": 19.838,
      "bytes": 6237203,
      "distinct_postals": 124443,
      "exists": true,
      "mtime_utc": "2026-08-01T22:19:14+00:00",
      "path": "processed/postal_universe_candidate_full_registered_geocoded.parquet",
      "postal_column": "postal_code",
      "row_count": 124443
    }
  },
  "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check",
  "mode": "p125_osm_status",
  "will_call_apis": false,
  "will_write_files": false
}
```

## Tests

```text
.....................................                                    [100%]
37 passed in 42.14s
```

## FINDINGS

1. The remaining P125 structured `measurement` label still said `coverage`, while adjacent policy fields correctly said `geometry evidence and coverage cross-check` and `not the address registry`.
2. The stale label was user-visible through `run.py p125-osm-status` and reused by readiness/batch-plan policy fixtures, so it was worth correcting even though no measured counts changed.

## DISAGREEMENTS

1. None.
