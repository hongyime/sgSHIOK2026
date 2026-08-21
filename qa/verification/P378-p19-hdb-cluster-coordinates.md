# P378 P19 HDB Cluster Coordinates

## Root Guard

```text
pwd=C:\sgSHIOK2026
```

## Evidence Path

```text
exit_code=1
```

## P19 Status Coordinate Output

Command:

```text
uv run python run.py p19-gap-status
```

Relevant output:

```json
[
  {
    "bbox": {
      "max_lat": 1.3585855,
      "max_lon": 103.9495319,
      "min_lat": 1.3581836,
      "min_lon": 103.9486325
    },
    "centroid": {
      "lat": 1.3584495,
      "lon": 103.9490744
    },
    "coordinate_count": 3,
    "coordinate_source": "cached_onemap_search_result",
    "development": "SUN PLAZA SPRING",
    "missing_postals": [
      "521400",
      "522400",
      "523400"
    ],
    "missing_rows": 3,
    "source": "hdb_2021_2026_geocoded",
    "years": [
      2026
    ]
  },
  {
    "bbox": {
      "max_lat": 1.4242769,
      "max_lon": 103.836389,
      "min_lat": 1.4233001,
      "min_lon": 103.8362424
    },
    "centroid": {
      "lat": 1.4237757,
      "lon": 103.8363103
    },
    "coordinate_count": 3,
    "coordinate_source": "cached_onemap_search_result",
    "development": "YISHUN BEACON",
    "missing_postals": [
      "762936",
      "763936",
      "764936"
    ],
    "missing_rows": 3,
    "source": "hdb_2021_2026_geocoded",
    "years": [
      2026
    ]
  }
]
```

## Focused Tests

Command:

```text
uv run pytest tests/test_analysis_scripts.py tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 39 items

tests\test_analysis_scripts.py ....                                      [ 10%]
tests\test_batch_plan.py ..........                                      [ 35%]
tests\test_production_readiness.py .........................             [100%]

============================= 39 passed in 51.45s =============================
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diffs

Command:

```text
git diff -- pipeline/config/weights.yaml
git diff -- checksums.json
git diff -- web/public/data
```

Output:

```text
```

## FINDINGS

1. The cached P19 HDB geocode cache already locates both three-row HDB missing clusters, so the status command can report centroids and bboxes without calling OneMap.
2. SUN PLAZA SPRING's missing frozen-v1 postals cluster around centroid 1.3584495, 103.9490744.
3. YISHUN BEACON's missing frozen-v1 postals cluster around centroid 1.4237757, 103.8363103.
4. MCST proxy clusters remain unlocated in this status output because P19 did not geocode/cache MCST coordinates.

## DISAGREEMENTS

1. None.
