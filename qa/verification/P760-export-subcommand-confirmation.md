# P760 export subcommand direct-write confirmation guards

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No export, transit export, provenance refresh, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
pipeline.export export-transit and refresh-provenance were direct writer subcommands. run.py required confirmations, but direct module execution could write transit artifacts or mutate bundle manifest provenance after only naming --output.

pipeline.export now requires --confirm-export for export-transit and --confirm-refresh-provenance for refresh-provenance. run.py forwards those module-owned confirmations instead of stripping them.
```

## Verification

```text
uv run pytest tests/test_export.py tests/test_run.py -q
........................................................................ [ 58%]
....................................................                     [100%]
124 passed in 187.45s (0:03:07)
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
588 tests collected in 26.57s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
git diff --check; Write-Output "exit_code=$LASTEXITCODE"; git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases; Write-Output "protected_exit_code=$LASTEXITCODE"
exit_code=0
protected_exit_code=0
```

## FINDINGS

1. `pipeline.export export-transit` needed a module-owned confirmation because it can write transit artifact directories outside `run.py`.
2. `pipeline.export refresh-provenance` needed a module-owned confirmation because it can mutate an existing bundle manifest outside `run.py`.
3. The collected test count moved from 586 to 588 because P760 adds two export CLI confirmation tests and executes no export or provenance refresh.

## DISAGREEMENTS

1. None.
