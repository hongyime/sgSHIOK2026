# P762 network-debug direct-writer confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No network-debug rebuild, network build, export, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
run.py network-debug required --confirm-network-debug, but direct execution of scripts.rebuild_network_debug could still read QA input and write compact network debug GeoJSON after only passing explicit-output validation.

scripts.rebuild_network_debug now requires --confirm-network-debug before reading QA input or writing output. run.py forwards that module-owned confirmation instead of stripping it.
```

## Verification

```text
uv run pytest tests/test_rebuild_network_debug.py tests/test_run.py -q
................................................................         [100%]
64 passed in 2.01s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
591 tests collected in 8.26s
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

1. `scripts.rebuild_network_debug` needed a direct confirmation because it can write compact network-debug GeoJSON outside `run.py`.
2. Existing explicit-output validation remains first; fresh-output invocations now fail at the approval boundary before QA input reads or output writes.
3. The collected test count moved from 590 to 591 because P762 adds one network-debug CLI confirmation test and executes no debug rebuild.

## DISAGREEMENTS

1. None.
