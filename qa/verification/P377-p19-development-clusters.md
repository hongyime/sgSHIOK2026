# P377 P19 Development Clusters

## Root Guard

```text
pwd=C:\sgSHIOK2026
```

## Evidence Path

```text
exit_code=1
```

## P19 Status Cluster Output

Command:

```text
uv run python run.py p19-gap-status
```

Relevant output:

```json
{
  "missing_development_clusters": [
    {
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
    },
    {
      "development": "CANAAN",
      "missing_postals": [
        "378720"
      ],
      "missing_rows": 1,
      "source": "mcst_2021_2026",
      "years": [
        2023
      ]
    },
    {
      "development": "MYRA",
      "missing_postals": [
        "935456"
      ],
      "missing_rows": 1,
      "source": "mcst_2021_2026",
      "years": [
        2024
      ]
    }
  ]
}
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

======================== 39 passed in 82.54s (0:01:22) ========================
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

1. The eight cached P19 missing rows are not eight unrelated developments; they collapse to four development clusters.
2. The two largest clusters are both 2026 HDB projects: SUN PLAZA SPRING with three missing postals and YISHUN BEACON with three missing postals.
3. The MCST proxy misses are isolated one-row clusters: CANAAN in 2023 and MYRA in 2024.

## DISAGREEMENTS

1. None.
