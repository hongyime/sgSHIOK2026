# P507 run help freshness summary names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

`run.py --help` now states that `check --freshness-only` writes no manifest and groups action summaries with source names.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py -q
...............                                                          [100%]
15 passed in 0.83s
```

```text
PS C:\sgSHIOK2026> uv run python run.py --help
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, and groups action summaries with source names.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest.
  p19-gap-status reads cached P19 measurement status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p19-mcst-locations reads existing P379 MCST proxy probe status only; it calls no APIs and writes no files.
  p125-osm-status reads cached P125 Overpass output and frozen v1 universe only, reporting OSM as geometry evidence and coverage cross-check rather than the address registry; it calls no APIs and writes no files.
  readiness validates the published shelter-map bundle and release gates without scoring or deploying.
  readiness --gate-summary prints the same release gate verdict and warnings without the full nested report.
  batch-plan dry-runs batch prerequisites and policy status without scoring.

Gated pipeline tasks:
  ingest | lamp-overlay | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  task

options:
  -h, --help  show this help message and exit
```

## FINDINGS

1. `run.py --help` still used the older freshness-only wording after the CLI output, README, agent docs, browser copy, and structured policy had adopted named source summaries.
2. This is runner help/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
