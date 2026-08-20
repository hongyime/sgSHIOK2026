# P125 OSM Postcode Coverage

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deployment, public data mutation, protected QA mutation, or weights.yaml edit was performed.
```

## Overpass Query

```text
query_path=C:\sgSHIOK2026\qa\p125\overpass_sg_addr_postcode.query
[out:json][timeout:180];
area["ISO3166-1"="SG"][admin_level=2]->.sg;
(
  node["addr:postcode"](area.sg);
  way["addr:postcode"](area.sg);
  relation["addr:postcode"](area.sg);
);
out tags;
```

## Overpass Fetch

```text
curl_exit=0
elapsed_seconds=13.124
output_path=C:\sgSHIOK2026\qa\p125\overpass_sg_addr_postcode.json
bytes=10748837
62116c9c8917995e90ed62b49fd1625526b2a0fc533064d829901c2c2c080897
```

## Overpass Metadata

```text
0.6
Overpass API 0.7.62.11 87bfad18
{'timestamp_osm_base': '2026-08-20T13:44:51Z', 'timestamp_areas_base': '2026-08-20T02:52:51Z', 'copyright': 'The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.'}
```

## Frozen Universe Anchor

```text
b9fafede1add6d5d44c689d66d08849c4d38899b1e9295409138ffc0c0613a64
6237203
```

## Parsed Comparison

```text
overpass_elements 32250
overpass_elements_by_type {'node': 6584, 'way': 25141, 'relation': 525}
overpass_addr_postcode_values 32250
overpass_distinct_addr_postcode_all 25902
overpass_distinct_addr_postcode_valid_6digit 25879
overpass_invalid_distinct_count 23
overpass_invalid_distinct_sample ['#B1-42', '01-01', '01-05', '135', '18983', '228232;228239', '2395661', '48618', '49406', '500003;500002', '50336', '510222;510221;510223', '52082', '59443', '59815', '62864', '769666,769668', '80739', '81005', '82001']
overpass_first_20_valid ['009901', '018593', '018906', '018916', '018935', '018936', '018940', '018947', '018953', '018956', '018957', '018960', '018961', '018962', '018965', '018969', '018971', '018972', '018974', '018980']
overpass_last_20_valid ['829756', '829768', '829769', '829853', '829854', '829855', '829856', '829857', '829858', '829879', '829899', '829909', '829910', '829911', '829912', '829913', '829974', '883390', '918104', '918141']
universe_path C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet
universe_rows 124443
universe_columns ['postal_code', 'lat', 'lon', 'x', 'y', 'coordinate_source', 'status', 'address', 'building', 'road_name', 'sources']
universe_postal_column postal_code
universe_distinct_postals 124443
osm_valid_in_universe 25873
osm_valid_not_in_universe 6
universe_not_in_osm_valid 98570
osm_coverage_of_universe_pct 20.791045
osm_only_sample ['289916', '289917', '289918', '289919', '289920', '519454']
universe_only_sample ['000104', '000105', '000106', '000135', '000207', '000208', '000315', '000316', '000511', '000512', '000617', '000718', '000719', '000820', '000821', '000922', '001024', '001025', '001026', '001027', '001130', '001232', '001233', '001334', '001438', '001439', '001441', '001542', '001543', '001648', '001750', '001781', '001953', '001954', '001955', '002262', '002367', '002469', '002677', '002880', '018907', '018910', '018925', '018926', '018927', '018928', '018929', '018930', '018937']
```

## OSM-Only Elements

```text
osm_only_element_count 6
{'type': 'way', 'id': 1489381415, 'postcode': '519454', 'tags': {'addr:city': 'Singapore', 'addr:housenumber': '1', 'addr:postcode': '519454', 'addr:street': 'Pasir Ris Industrial Close', 'building': 'industrial'}}
{'type': 'way', 'id': 1549111124, 'postcode': '289920', 'tags': {'addr:city': 'Singapore', 'addr:country': 'SG', 'addr:housenumber': '760', 'addr:postcode': '289920', 'addr:street': 'Dunearn Road', 'building': 'residential'}}
{'type': 'way', 'id': 1549111125, 'postcode': '289916', 'tags': {'addr:city': 'Singapore', 'addr:country': 'SG', 'addr:housenumber': '762', 'addr:postcode': '289916', 'addr:street': 'Dunearn Road', 'building': 'residential'}}
{'type': 'way', 'id': 1549111126, 'postcode': '289917', 'tags': {'addr:city': 'Singapore', 'addr:country': 'SG', 'addr:housenumber': '766', 'addr:postcode': '289917', 'addr:street': 'Dunearn Road', 'building': 'residential'}}
{'type': 'way', 'id': 1549111127, 'postcode': '289919', 'tags': {'addr:city': 'Singapore', 'addr:country': 'SG', 'addr:housenumber': '760', 'addr:postcode': '289919', 'addr:street': 'Dunearn Road', 'building': 'residential'}}
{'type': 'way', 'id': 1549111128, 'postcode': '289918', 'tags': {'addr:city': 'Singapore', 'addr:country': 'SG', 'addr:housenumber': '768', 'addr:postcode': '289918', 'addr:street': 'Dunearn Road', 'building': 'residential'}}
```

## Arithmetic

```text
OSM valid distinct addr:postcode values = 25,879
Frozen v1 distinct postals = 124,443
Overlap = 25,873
OSM-only valid postcodes = 25,879 - 25,873 = 6
V1 postals absent from OSM addr:postcode = 124,443 - 25,873 = 98,570
OSM coverage of frozen v1 = 25,873 / 124,443 * 100 = 20.791045%
```

## Validation

```text
git check-ignore -v qa/verification/P125-osm-postcode-coverage.md; "exit=$LASTEXITCODE"
exit=1

git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0

git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0

python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. OSM `addr:postcode` is far too sparse to be the primary Singapore postal-universe registry: it covers only 25,873 of 124,443 frozen v1 postals, or 20.791045%.
2. OSM still contributes six valid six-digit postcodes not present in the frozen v1 universe, so it is useful as a signal for candidate gaps, not as a complete registry.

## DISAGREEMENTS

1. None.
