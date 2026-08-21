# P388 Lamp Overlay Runner Boundary

## Scope

Free-tier runner/docs/test change only. No scoring, export, rescore, ingest, network build, deploy, or public-data artifact build was run.

## Working Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Tests

Command:

```text
uv run pytest tests/test_run.py tests/test_readme.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 14 items

tests\test_run.py ..........                                             [ 71%]
tests\test_readme.py ....                                                [100%]

============================= 14 passed in 5.68s ==============================
```

## Help Output

Command:

```text
uv run python run.py --help
```

Output:

```text
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p125-osm-status | readiness | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest.
  p19-gap-status reads cached P19 measurement status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p125-osm-status reads cached P125 Overpass output and frozen v1 universe only; it calls no APIs and writes no files.
  readiness validates the published shelter-map bundle and release gates without scoring or deploying.
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

1. `run.py` already dispatched `lamp-overlay`, but the visible help docstring did not name it in the gated pipeline task list. That made a public-data-writing artifact builder less visible than lower-risk safe reports.
2. README documented the existing `lamp_posts_v1/` artifact and the owner-approval boundary, but did not name the runner command or the new-version-only path convention that the builder already enforces.
3. The change only documents and tests the existing dispatch boundary; it does not run the lamp overlay builder and writes nothing under `web/public/data/`.

## DISAGREEMENTS

1. None.
