# P714 Overture output guard

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, Overture query, raw archive write, input mutation, public-data write, or deployment.

## Change

`pipeline.overture_addresses` now refuses existing requested `--output` and `--outlier-geojson` paths before the candidate report builder can read the current universe, query Overture through DuckDB/S3, or archive raw candidate rows.

The helper still allows stdout-only exploratory runs and still allows archive writes when explicitly requested; this change only prevents accidental mutation of named report artifacts.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
......FF                                                                 [100%]
================================== FAILURES ===================================
```

```text
498 tests collected in 20.60s
```

```text
........                                                                 [100%]
8 passed in 4.20s
```

```text
498 tests collected in 12.36s
```

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
exit=0
```

## FINDINGS

1. `pipeline.overture_addresses` could overwrite both the JSON report and optional outlier GeoJSON after doing the expensive candidate-source query path.
2. The first regression test run exposed that path assertions against raw JSON stdout are brittle on Windows because JSON escapes backslashes. The final tests parse the JSON payload instead.

## DISAGREEMENTS

1. None.
