# P488 Runner Surface Docs

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P488-runner-surface-docs.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Runner Help

```text
Command: uv run python C:\sgSHIOK2026\run.py --help
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest.
  p19-gap-status reads cached P19 measurement status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p19-mcst-locations reads existing P379 MCST proxy probe status only; it calls no APIs and writes no files.
  p125-osm-status reads cached P125 Overpass output and frozen v1 universe only; it calls no APIs and writes no files.
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

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_readme.py C:\sgSHIOK2026\tests\test_agent_docs.py -q
.....                                                                    [100%]
5 passed in 0.88s
```

## FINDINGS

1. README and `CLAUDE.md` had drifted from `run.py --help`: they omitted `score-batch` and `export-transit` from gated pipeline tasks, and `CLAUDE.md` did not name `readiness --gate-summary` in safe reports.
2. README described `test` inside the gated pipeline-task list even though `run.py --help` lists only pipeline-mutating or release tasks there; the docs now call it the local `test` task.

## DISAGREEMENTS

1. None.
