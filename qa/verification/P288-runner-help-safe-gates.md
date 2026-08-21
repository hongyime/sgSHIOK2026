# P288 Runner Help Safe Gates

## Evidence

Command output is recorded below for the runner-help safe/gated task split.

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

```text
> uv run pytest tests/test_run.py -q
.....                                                                    [100%]
5 passed in 1.41s
```

```text
> uv run python run.py --help
usage: run.py [-h]
              {batch-plan,bus-arrivals,bus-connector-diagnostics,candidate-audit,check,compare-targeted,export,export-transit,geocode-universe,ingest,lamp-overlay,network,network-debug,network-preflight,network-qa,onemap-outlier-replay,onemap-outlier-triage,onemap-validation,overture-addresses,p19-gap-status,postal-universe,publish,readiness,refresh-provenance,score,score-batch,shell,test,validate}

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | readiness | batch-plan

Gated pipeline tasks:
  ingest | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  {batch-plan,bus-arrivals,bus-connector-diagnostics,candidate-audit,check,compare-targeted,export,export-transit,geocode-universe,ingest,lamp-overlay,network,network-debug,network-preflight,network-qa,onemap-outlier-replay,onemap-outlier-triage,onemap-validation,overture-addresses,p19-gap-status,postal-universe,publish,readiness,refresh-provenance,score,score-batch,shell,test,validate}

options:
  -h, --help            show this help message and exit
EXIT_CODE=0
```

```text
> python scripts/check_repo_integrity.py; Write-Output "EXIT_CODE=$LASTEXITCODE"
repo_integrity=ok
EXIT_CODE=0
```

```text
> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT_CODE=$LASTEXITCODE"
EXIT_CODE=0
```

## FINDINGS

1. `run.py --help` listed every task in one flat argparse choices line, so the command-selection surface did not distinguish safe reports from gated pipeline tasks. The help description now separates zero-mutation safe reports from owner-gated pipeline tasks.

## DISAGREEMENTS

1. None.
