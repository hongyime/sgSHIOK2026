# P751 deploy wrapper confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier release-wrapper guard work only.
No scoring, export, rescore, subset run, ingest, network build, validation run, deployment, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
scripts/deploy-production.ps1 was still a direct production deployment wrapper without its own outer confirmation. It self-supplied run.py publish --confirm-publish --confirm-production, so a direct wrapper invocation or scripts/full-rescore-production.ps1 -Deploy could publish after only the wrapper call.

scripts/release-data-bundle.ps1 already had -ConfirmProduction, so it now passes that confirmation through to deploy-production.ps1.

scripts/full-rescore-production.ps1 now requires -ConfirmProductionDeploy in addition to -ConfirmFullBatch when -Deploy is requested. Full-batch approval is not production publish approval.
```

## Verification

```text
uv run pytest tests/test_release_scripts.py tests/test_run.py tests/test_publish.py -q
.....................................................................    [100%]
69 passed in 19.59s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
git diff --check; Write-Output "exit_code=$LASTEXITCODE"
exit_code=0
```

```text
git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases; Write-Output "protected_exit_code=$LASTEXITCODE"
protected_exit_code=0
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
575 tests collected in 10.64s
```

## FINDINGS

1. `deploy-production.ps1` needed a wrapper-level production confirmation because it reaches `run.py publish --deploy` and internally supplies the lower-level confirmation flags.
2. `full-rescore-production.ps1 -Deploy` needed a deploy-specific confirmation because `-ConfirmFullBatch` approves the long batch, not production publication.
3. The collected test count moved from 573 to 575 because P751 adds two release-wrapper source tests and executes no pipeline.

## DISAGREEMENTS

1. None.
