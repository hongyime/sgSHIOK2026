# P753 full OneMap wrapper confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier wrapper guard work only.
No OneMap collection, scoring, export, rescore, subset run, ingest, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
scripts/full-onemap-validation.ps1 could create qa/onemap_full_validation_* output and internally pass --confirm-onemap-collection to run.py onemap-validation collect without its own wrapper-level approval.

scripts/watch-full-onemap-validation.ps1 could create watchdog output and repeatedly start the full validation runner without its own wrapper-level approval.

Both wrappers now return a plan-only response unless -ConfirmFullOnemapValidation is supplied. The watchdog forwards that confirmation to the runner it starts.
```

## Verification

```text
uv run pytest tests/test_release_scripts.py tests/test_run.py tests/test_onemap_validation.py tests/test_probe_onemap.py -q
........................................................................ [ 72%]
...........................                                              [100%]
99 passed in 33.81s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
578 tests collected in 11.75s
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

1. The full OneMap validation wrapper needed its own confirmation because it writes QA run output and internally supplies the runner-level OneMap collection confirmation.
2. The full OneMap watchdog needed the same confirmation because it can restart the collecting wrapper repeatedly.
3. The collected test count moved from 576 to 578 because P753 adds two release-wrapper source tests and executes no pipeline or OneMap collection.

## DISAGREEMENTS

1. None.
