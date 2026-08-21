# P312 runner safe-report descriptions

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier runner help text and focused tests only. No scoring, export, rescore,
subset run, ingest, network build, upstream API probe, P19 status command,
public-data mutation, deployment, or locked-weight change was run.

## Verification commands

```text
> uv run pytest tests/test_run.py -q -p no:cacheprovider
......                                                                   [100%]
6 passed in 1.09s

> uv run python run.py --help
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | readiness | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest.
  p19-gap-status reads cached P19 measurement status only; it calls no APIs and writes no files.
  readiness validates the current bundle and release gates without scoring or deploying.
  batch-plan dry-runs batch prerequisites and policy status without scoring.

Gated pipeline tasks:
  ingest | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  task

options:
  -h, --help  show this help message and exit

> python scripts/check_repo_integrity.py; Write-Output "REPO_INTEGRITY_EXIT=$LASTEXITCODE"
repo_integrity=ok
REPO_INTEGRITY_EXIT=0

> git diff -- pipeline/config/weights.yaml; Write-Output "WEIGHTS_DIFF_EXIT=$LASTEXITCODE"
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. `run.py --help` listed safe reports, but only `p19-gap-status` explained its
   safety boundary. The other safe report names still required the operator to
   know from README/tests whether they could mutate files, call APIs, score, or
   deploy. The help now names the relevant no-write, metadata-only, no-scoring,
   and no-deploy boundaries directly.

## DISAGREEMENTS

1. None.
