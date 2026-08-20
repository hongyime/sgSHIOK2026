# P63 OSM Postcode Coverage

## Root Guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Remote Check

```text
75129e474d35490f71f441264f9775bacc194e85	refs/heads/main
```

## Frozen Universe Baseline

Command:

```text
Get-Content -LiteralPath 'C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded_summary.json'
```

Output excerpt:

```text
  "geocoded_universe": "processed\\postal_universe_candidate_full_registered_geocoded.parquet",
  "mode": "candidate_full_registered",
  "needs_geocode": 476,
  "ready_to_score": 123967,
  "total_unique_postals": 124443,
```

Command:

```text
uv run python - <<'PY'
from pathlib import Path
import pandas as pd
root = Path(r'C:\sgSHIOK2026')
path = root / 'processed' / 'postal_universe_candidate_full_registered_geocoded.parquet'
df = pd.read_parquet(path, columns=['postal_code'])
postals = df['postal_code'].astype(str).str.zfill(6)
print(f'path={path}')
print(f'rows={len(df)}')
print(f'distinct_postals={postals.nunique()}')
print(f'min_postal={postals.min()}')
print(f'max_postal={postals.max()}')
print(f'blank_count={(postals.str.strip() == "").sum()}')
print(f'duplicate_rows={len(df) - postals.nunique()}')
PY
```

Output:

```text
path=C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet
rows=124443
distinct_postals=124443
min_postal=000104
max_postal=918146
blank_count=0
duplicate_rows=0
```

## Overpass Endpoint Discovery

Command:

```text
uv run python - <<'PY'
from __future__ import annotations
import time
import httpx
query='''[out:json][timeout:180];
(
  node(1.13,103.55,1.48,104.12)["addr:postcode"];
  way(1.13,103.55,1.48,104.12)["addr:postcode"];
  relation(1.13,103.55,1.48,104.12)["addr:postcode"];
);
out tags qt;'''
headers={'User-Agent':'sgSHIOK2026-P63-postcode-coverage/1.0'}
for endpoint in ['https://gall.openstreetmap.de/api/interpreter','https://lambert.openstreetmap.de/api/interpreter']:
    print(f'--- {endpoint} ---')
    start=time.perf_counter()
    try:
        r=httpx.post(endpoint, data={'data': query}, headers=headers, timeout=240.0)
        print(f'status_code={r.status_code}')
        print(f'elapsed_seconds={time.perf_counter()-start:.3f}')
        print(f'response_bytes={len(r.content)}')
        print('response_head=')
        print(r.text[:800])
    except Exception as exc:
        print(f'elapsed_seconds={time.perf_counter()-start:.3f}')
        print(f'error_type={type(exc).__name__}')
        print(f'error={exc}')
PY
```

Output:

```text
--- https://gall.openstreetmap.de/api/interpreter ---
status_code=200
elapsed_seconds=6.742
response_bytes=12328196
response_head=
{
  "version": 0.6,
  "generator": "Overpass API 0.7.62.11 87bfad18",
  "osm3s": {
    "timestamp_osm_base": "2026-08-20T08:59:47Z",
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
    "office": "estate_agent",
    "opening_hours": "Mo-Fr 08:30-17:30; Sa 08:30-12:30",
    "phone": "+65 6344 0555",
    "website": "http://www.shinetuassouth.com"
  }
},
{
  "type": "node",
  "id": 9265800410,
  "tags": {
    "addr:city": "Singapore",
    "addr:country": "SG",
    "addr:housenumber": "2",
    "addr:postcode": "636904",
    "addr:street": "
--- https://lambert.openstreetmap.de/api/interpreter ---
status_code=200
elapsed_seconds=11.598
response_bytes=12328196
response_head=
{
  "version": 0.6,
  "generator": "Overpass API 0.7.62.11 87bfad18",
  "osm3s": {
    "timestamp_osm_base": "2026-08-20T09:00:48Z",
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
    "office": "estate_agent",
    "opening_hours": "Mo-Fr 08:30-17:30; Sa 08:30-12:30",
    "phone": "+65 6344 0555",
    "website": "http://www.shinetuassouth.com"
  }
},
{
  "type": "node",
  "id": 9265800410,
  "tags": {
    "addr:city": "Singapore",
    "addr:country": "SG",
    "addr:housenumber": "2",
    "addr:postcode": "636904",
    "addr:street": "
```

## Overpass Coverage Measurement

Command:

```text
uv run python - <<'PY'
from __future__ import annotations
import json
import re
import time
from collections import Counter
from pathlib import Path

import httpx
import pandas as pd

root = Path(r'C:\sgSHIOK2026')
universe_path = root / 'processed' / 'postal_universe_candidate_full_registered_geocoded.parquet'
universe = set(pd.read_parquet(universe_path, columns=['postal_code'])['postal_code'].astype(str).str.zfill(6))
query = '''[out:json][timeout:180];
(
  node(1.13,103.55,1.48,104.12)["addr:postcode"];
  way(1.13,103.55,1.48,104.12)["addr:postcode"];
  relation(1.13,103.55,1.48,104.12)["addr:postcode"];
);
out tags qt;'''
endpoint = 'https://gall.openstreetmap.de/api/interpreter'
headers = {'User-Agent':'sgSHIOK2026-P63-postcode-coverage/1.0'}
start = time.perf_counter()
r = httpx.post(endpoint, data={'data': query}, headers=headers, timeout=240.0)
elapsed = time.perf_counter() - start
print(f'endpoint={endpoint}')
print('query=')
print(query)
print(f'status_code={r.status_code}')
print(f'elapsed_seconds={elapsed:.3f}')
print(f'response_bytes={len(r.content)}')
r.raise_for_status()
payload = r.json()
elements = payload.get('elements', [])
osm_base = (payload.get('osm3s') or {}).get('timestamp_osm_base')
raw_values = []
type_counts = Counter()
for element in elements:
    tags = element.get('tags') or {}
    value = str(tags.get('addr:postcode') or '').strip()
    if value:
        raw_values.append(value)
        type_counts[str(element.get('type'))] += 1
valid = {value for value in raw_values if re.fullmatch(r'\d{6}', value)}
invalid = sorted(set(raw_values) - valid)
osm_only = sorted(valid - universe)
frozen_only = sorted(universe - valid)
intersection = valid & universe
print(f'osm_base={osm_base}')
print(f'elements={len(elements)}')
print(f'element_type_counts={dict(sorted(type_counts.items()))}')
print(f'raw_postcode_values={len(raw_values)}')
print(f'distinct_raw_postcodes={len(set(raw_values))}')
print(f'distinct_valid_six_digit_postcodes={len(valid)}')
print(f'invalid_distinct_postcodes={len(invalid)}')
print(f'frozen_universe_path={universe_path}')
print(f'frozen_universe_postcodes={len(universe)}')
print(f'intersection={len(intersection)}')
print(f'osm_only={len(osm_only)}')
print(f'frozen_only={len(frozen_only)}')
print(f'osm_coverage_of_frozen_percent={len(intersection) / len(universe) * 100:.3f}')
print(f'frozen_coverage_of_osm_percent={len(intersection) / len(valid) * 100:.3f}' if valid else 'frozen_coverage_of_osm_percent=NA')
print(f'invalid_samples={invalid[:25]}')
print(f'osm_only_samples={osm_only[:50]}')
print(f'frozen_only_samples={frozen_only[:50]}')
PY
```

Output:

```text
endpoint=https://gall.openstreetmap.de/api/interpreter
query=
[out:json][timeout:180];
(
  node(1.13,103.55,1.48,104.12)["addr:postcode"];
  way(1.13,103.55,1.48,104.12)["addr:postcode"];
  relation(1.13,103.55,1.48,104.12)["addr:postcode"];
);
out tags qt;
status_code=200
elapsed_seconds=12.487
response_bytes=12328196
osm_base=2026-08-20T09:00:48Z
elements=37900
element_type_counts={'node': 6742, 'relation': 544, 'way': 30614}
raw_postcode_values=37900
distinct_raw_postcodes=25941
distinct_valid_six_digit_postcodes=25879
invalid_distinct_postcodes=62
frozen_universe_path=C:\sgSHIOK2026\processed\postal_universe_candidate_full_registered_geocoded.parquet
frozen_universe_postcodes=124443
intersection=25873
osm_only=6
frozen_only=98570
osm_coverage_of_frozen_percent=20.791
frozen_coverage_of_osm_percent=99.977
invalid_samples=['#B1-42', '-', '01-01', '01-05', '11223', '135', '18983', '228232;228239', '2395661', '29400', '29432', '29437', '29443', '29444', '29453', '29454', '29456', '29458', '29464', '29465', '29467', '29844', '48618', '49406', '500003;500002']
osm_only_samples=['289916', '289917', '289918', '289919', '289920', '519454']
frozen_only_samples=['000104', '000105', '000106', '000135', '000207', '000208', '000315', '000316', '000511', '000512', '000617', '000718', '000719', '000820', '000821', '000922', '000923', '001024', '001025', '001026', '001027', '001130', '001232', '001233', '001334', '001438', '001439', '001441', '001542', '001543', '001648', '001750', '001781', '001953', '001954', '001955', '002262', '002367', '002469', '002677', '002880', '018907', '018910', '018925', '018926', '018927', '018928', '018929', '018930', '018937']
```

## Arithmetic

```text
frozen_universe_postcodes = 124443
distinct_valid_six_digit_postcodes = 25879
intersection = 25873
osm_only = 25879 - 25873 = 6
frozen_only = 124443 - 25873 = 98570
osm_coverage_of_frozen_percent = 25873 / 124443 * 100 = 20.791
frozen_coverage_of_osm_percent = 25873 / 25879 * 100 = 99.977
```

## FINDINGS

1. Live OSM via Overpass is not a plausible replacement address registry for sgSHIOK v2: it covers only 25,873 of 124,443 frozen-universe postcodes, or 20.791%.
2. OSM is nearly a subset of the frozen universe for valid six-digit postcodes: only 6 valid OSM postcodes were absent from the frozen universe.
3. OSM remains valuable as geometry, but this measurement argues against treating Overpass `addr:postcode` as the primary current postal-universe source.
4. The project's older OSM extract recorded 25,629 valid unique postals in the frozen-universe summary; live Overpass measured 25,879, a net increase of 250 valid distinct OSM postcodes but still far below the frozen 124,443 baseline.
5. No scoring, export, rescore, subset run, ingest, network build, input rebuild, public data write, deployment, or weight change was run.

## DISAGREEMENTS

1. None.
