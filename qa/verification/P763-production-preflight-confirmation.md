# P763 production preflight wrapper confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier wrapper/test work only.
No production preflight run, network QA, network preflight, bundle validation run, npm ci, web test run outside pytest, export, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
scripts/preflight-production.ps1 could be run directly without a wrapper-owned confirmation. It can call static validation, network QA/preflight, ensure-web-deps.ps1, and npm --prefix web test; ensure-web-deps.ps1 may run npm ci if required bins are missing.

scripts/preflight-production.ps1 now defaults to a plan-only response unless -ConfirmProductionPreflight is supplied. scripts/release-data-bundle.ps1 forwards -ConfirmProductionPreflight after -ConfirmProduction so the approved release path remains connected.
```

## Verification

```text
uv run pytest tests/test_release_scripts.py -q
...........                                                              [100%]
11 passed in 0.92s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
593 tests collected in 14.14s
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

1. `scripts/preflight-production.ps1` needed a wrapper-owned confirmation because direct use can reach `ensure-web-deps.ps1`, which may run `npm ci`, and can run release-path validation/test commands.
2. Direct preflight now returns a plan-only response until `-ConfirmProductionPreflight` is supplied.
3. The collected test count moved from 591 to 593 because P763 adds two release-wrapper source tests and executes no production preflight.

## DISAGREEMENTS

1. None.
