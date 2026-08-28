# P755 fetch ingest module confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No ingest, refetch, input rebuild, scoring, export, rescore, subset run, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
run.py ingest required --confirm-input-refresh, but direct execution of pipeline.fetch ingest could still mutate raw/ and raw/manifest.json without a module-owned confirmation.

pipeline.fetch now owns --confirm-input-refresh for ingest, and it rejects unconfirmed ingest before loading source config. run.py now forwards the same confirmation flag instead of stripping it.
```

## Verification

```text
uv run pytest tests/test_fetch.py tests/test_run.py -q
........................................................................ [ 85%]
............                                                             [100%]
84 passed in 9.29s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
581 tests collected in 14.24s
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

1. `pipeline.fetch ingest` needed a module-owned confirmation because it can mutate `raw/` and `raw/manifest.json` outside `run.py`.
2. The unconfirmed ingest rejection now happens before source config loading, so accidental direct invocation fails before touching source selection or inputs.
3. The collected test count moved from 580 to 581 because P755 adds one fetch/run confirmation test and executes no ingest or network probe.

## DISAGREEMENTS

1. None.
