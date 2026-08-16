# P19 Universe Gap Measurement

Date: 2026-08-16

Working root and host:

```text
PRAWN-E14
C:\sgSHIOK2026
```

Scope:

```text
Measured current postal-universe coverage from public HDB, BCA MCST, OneMap Search, and Overpass signals.
No scoring, export, rescore, subset run, ingest, or network build was run.
No existing raw/, processed/, web/public/data/, checksums.json, or qa/p6-* through qa/p11/* artifact was modified.
pipeline/config/weights.yaml was not modified.
```

Repository state at start:

```text
## p11-land-work
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
365fa9f50d981931647d89c5c853ec7f66435b1c
365fa9f50d981931647d89c5c853ec7f66435b1c	refs/heads/main
```

Credential check:

```text
ONEMAP_EMAIL=missing
ONEMAP_PASSWORD=missing
DATAGOV_API_KEY=missing
DATA_GOV_SG_API_KEY=missing
URA_ACCESS_KEY=missing
URA_API_KEY=missing
LTA_DATAMALL_ACCOUNT_KEY=missing
```

Sample sizes:

```text
hdb total 13357 new 2021-2026 residential units>0 rows 749
hdb by year {2021: 109, 2022: 137, 2023: 156, 2024: 142, 2025: 149, 2026: 56}
mcst total 3806 new active 2021-2026 rows with postals 233
mcst by year {2021: 34, 2022: 30, 2023: 52, 2024: 65, 2025: 44, 2026: 8}
```

Overpass feasibility probe:

```text
status 200 elapsed 14.029 bytes 10743974
{
  "version": 0.6,
  "generator": "Overpass API 0.7.62.11 87bfad18",
  "osm3s": {
    "timestamp_osm_base": "2026-08-16T01:50:20Z",
    "timestamp_areas_base": "2026-08-14T19:41:24Z",
    "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
  },
  "elements": [

{
  "type": "node",
  "id": 5842961285,
  "tags": {
    "addr:postcode": "636901",
    "email": "Benjaminchong@hlsgroup.com.sg",
    "name": "SHINE@TUAS SOUTH",
    "off
```

Initial HDB geocode weakness:

```text
HDB geocoding first run returned postals for only 214/749 rows because OneMap began returning HTTP 429 and HDB street abbreviations needed expansion. The script was corrected to retry 429s and expand HDB road names before final measurement.
```

Final measurement command:

```text
uv run python C:\sgSHIOK2026\scripts\analysis\p19_universe_gap_measurement.py --delay-sec 1.0
```

Final measurement output:

```json
{
  "combined_recent_completion_signal": {
    "missing_rows": 8,
    "missing_unique_postals": 8,
    "row_miss_rate": 0.008197,
    "rows_with_postal": 976
  },
  "generated_at_utc": "2026-08-16T02:08:55.624822+00:00",
  "hdb_2021_2026_geocoded": {
    "missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "missing_rows": 6,
    "missing_unique_postals": 6,
    "row_miss_rate": 0.008075,
    "rows": 749,
    "rows_with_postal": 743,
    "sample_missing_postals": [
      "521400",
      "522400",
      "523400",
      "762936",
      "763936",
      "764936"
    ],
    "unique_miss_rate": 0.008075,
    "unique_postals": 743
  },
  "mcst_2021_2026": {
    "missing_postals": [
      "378720",
      "935456"
    ],
    "missing_rows": 2,
    "missing_unique_postals": 2,
    "row_miss_rate": 0.008584,
    "rows": 233,
    "rows_with_postal": 233,
    "sample_missing_postals": [
      "378720",
      "935456"
    ],
    "unique_miss_rate": 0.009615,
    "unique_postals": 208
  },
  "method_limits": [
    "HDB Property Information has completion year but no postal code; this run geocodes each block/street through OneMap search and counts only rows with a six-digit returned postal.",
    "BCA MCST constitution date is a proxy for private strata completion/onboarding, not a TOP date.",
    "Overpass counts only OSM objects currently tagged with addr:postcode in Singapore, not an authoritative national address register."
  ],
  "overpass_addr_postcode": {
    "intersection": 25872,
    "missing_from_v1": 6,
    "sample_missing_from_v1": [
      "289916",
      "289917",
      "289918",
      "289919",
      "289920",
      "519454"
    ],
    "sample_v1_missing_from_overpass": [
      "000104",
      "000105",
      "000106",
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
      "018937",
      "018946"
    ],
    "unique_postcodes": 25878,
    "v1_missing_from_overpass": 98571
  },
  "sources": {
    "bca_mcst": {
      "dataset_id": "d_1f9391a2f1476cdaf4f05a8d3a05c257",
      "recent_filter": "ACTIVE, six-digit postal, 2021 <= Date of MC Constitution <= 2026",
      "recent_rows_by_year": {
        "2021": 34,
        "2022": 30,
        "2023": 52,
        "2024": 65,
        "2025": 44,
        "2026": 8
      },
      "total_rows": 3806
    },
    "hdb_property_info": {
      "dataset_id": "d_17f5382f26140b1fdae0ba2ef6239d2f",
      "recent_filter": "residential == Y, total_dwelling_units > 0, 2021 <= year_completed <= 2026",
      "recent_rows_by_year": {
        "2021": 109,
        "2022": 137,
        "2023": 156,
        "2024": 142,
        "2025": 149,
        "2026": 56
      },
      "total_rows": 13357
    },
    "overpass": {
      "areas_base": "2026-08-15T08:46:19Z",
      "bytes": 10743974,
      "elapsed_sec": 7.023,
      "element_count": 32236,
      "generator": "Overpass API 0.7.62.11 87bfad18",
      "osm_base": "2026-08-16T01:56:27Z",
      "url": "https://overpass-api.de/api/interpreter"
    }
  },
  "v1_universe": {
    "path": "processed/postal_universe_candidate_full_registered_geocoded.parquet",
    "rows": 124443,
    "status_counts": {
      "NEEDS_GEOCODE": 476,
      "READY_TO_SCORE": 123967
    },
    "unique_postals": 124443
  },
  "working_root": "C:\\sgSHIOK2026"
}
```

Missing recent HDB rows:

```text
HDB missing from v1
2026 400A TAMPINES ST 41 521400 SUN PLAZA SPRING 400A TAMPINES STREET 41 SUN PLAZA SPRING SINGAPORE 521400 block_road
2026 400B TAMPINES ST 41 522400 SUN PLAZA SPRING 400B TAMPINES STREET 41 SUN PLAZA SPRING SINGAPORE 522400 block_road
2026 400C TAMPINES ST 41 523400 SUN PLAZA SPRING 400C TAMPINES STREET 41 SUN PLAZA SPRING SINGAPORE 523400 block_road
2026 936B YISHUN CTRL 1 762936 YISHUN BEACON 936B YISHUN CENTRAL 1 YISHUN BEACON SINGAPORE 762936 block_road
2026 936C YISHUN CTRL 1 763936 YISHUN BEACON 936C YISHUN CENTRAL 1 YISHUN BEACON SINGAPORE 763936 block_road
2026 936D YISHUN CTRL 1 764936 YISHUN BEACON 936D YISHUN CENTRAL 1 YISHUN BEACON SINGAPORE 764936 block_road
HDB no postal
2023 127A PLANTATION CRES 127A PLANTATION CRES 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road 127A PLANTATION CRESCENT
2023 127B PLANTATION CRES 127B PLANTATION CRES 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road PIZZAHUT PLANTATION PLAZA
2023 126A TENGAH DR 126A TENGAH DR 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road DAISO PLANTATION PLAZA
2023 126B TENGAH DR 126B TENGAH DR 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road 7-11 PLANTATION PLAZA
2024 469A BT BATOK WEST AVE 9 469A BT BATOK WEST AVE 9 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road BUKIT BATOK WEST HAWKER CENTRE
2024 126C TENGAH DR 126C TENGAH DR 200 Authentication token missing. Please create an account and generate or renew your API Token. block_road KFC PLANTATION PLAZA
match methods
Counter({'block_road': 744, 'first_result': 5})
```

Missing recent MCST rows:

```text
MCST missing from v1
31/08/2023 4841 378720 CANAAN 11 MATTAR ROAD 378720
13/09/2024 4918 935456 MYRA 9 MEYAPPA CHETTIAR ROAD 935456
```

OneMap cache health after retry:

```text
cache entries 749
Counter({200: 749})
429 remaining []
```

FINDINGS

1. The measured recent-completion gap is small in this sample: 8 missing rows out of 976 rows with postals, or 0.8197%. This supports treating v2 universe work as useful cleanup, not an emergency caused by a five-digit missing-address hole.
2. The missing recent HDB postals are all 2026 rows from two developments: Sun Plaza Spring and Yishun Beacon.
3. The missing recent private-strata signal is two MCST rows: CANAAN at 378720 and MYRA at 935456.
4. Current Overpass has only 25,878 distinct Singapore `addr:postcode` values; 98,571 v1 postals are absent from Overpass. OSM remains useful geometry input, but this measurement does not support using Overpass as the address registry.
5. The public OneMap Search endpoint returned useful results while also embedding `Authentication token missing` in HTTP 200 responses; no OneMap credentials were present in the environment for this run.

DISAGREEMENTS

1. The private-residential sample is not a direct condo TOP sample. BCA MCST constitution date is the best open-data proxy found in this pass, but it is not the same thing as project completion/TOP.
