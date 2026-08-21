# P477 readiness summary discovery

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier operator discoverability only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> uv run python run.py --help | Select-String -- 'readiness --gate-summary|Safe reports'

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  readiness --gate-summary prints the same release gate verdict and warnings without the full nested report.
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py tests/test_readme.py -q -p no:cacheprovider
...................                                                      [100%]
19 passed in 0.96s
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. P476 added the concise readiness gate summary flag, but the primary task-runner and README entrypoints did not yet advertise it. `run.py --help` and README now name `readiness --gate-summary`, and tests prove `run.py readiness --gate-summary` forwards the flag to `scripts.production_readiness`.

## DISAGREEMENTS

1. None.
