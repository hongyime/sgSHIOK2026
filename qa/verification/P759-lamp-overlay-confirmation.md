# P759 lamp-overlay direct-build confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No lamp-overlay build, input download, ingest, refetch, input rebuild, scoring, export, rescore, subset run, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
run.py lamp-overlay required --confirm-lamp-overlay, but direct execution of pipeline.lamp_overlay could still write a new overlay artifact directory with only --output.

pipeline.lamp_overlay now requires --confirm-lamp-overlay before build_lamp_overlay_artifact() runs. run.py forwards the confirmation flag instead of stripping it.
```

## Verification

```text
uv run pytest tests/test_lamp_overlay.py tests/test_run.py -q
................................................................         [100%]
64 passed in 4.32s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
586 tests collected in 20.11s
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

1. `pipeline.lamp_overlay` needed a module-owned confirmation because it can write artifact directories outside `run.py`.
2. The unconfirmed direct build rejection now happens before output-directory creation or source reading.
3. The collected test count moved from 585 to 586 because P759 adds one lamp-overlay CLI confirmation test and executes no overlay build.

## DISAGREEMENTS

1. None.
