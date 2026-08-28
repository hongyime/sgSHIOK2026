# P752 full-rescore activation confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier release-wrapper guard work only.
No scoring, export, rescore, subset run, ingest, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
scripts/full-rescore-production.ps1 required -ConfirmFullBatch before long scoring work, but if -SkipActivateBundle was not supplied it rewrote web/data-bundle.json after export. Full-batch approval is not bundle activation approval.

The wrapper now requires -ConfirmActivation unless -SkipActivateBundle is supplied, and the check runs before partitioning, scoring, export, validation, activation, or deploy work starts.
```

## Verification

```text
uv run pytest tests/test_release_scripts.py tests/test_run.py tests/test_publish.py -q
......................................................................   [100%]
70 passed in 7.77s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
576 tests collected in 8.47s
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

1. `full-rescore-production.ps1` needed a distinct activation confirmation because it rewrites `web/data-bundle.json` after a full batch unless `-SkipActivateBundle` is supplied.
2. The collected test count moved from 575 to 576 because P752 adds one release-wrapper source test and executes no pipeline.

## DISAGREEMENTS

1. None.
