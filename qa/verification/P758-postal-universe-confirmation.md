# P758 postal-universe direct-build confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No postal-universe build, input download, ingest, refetch, input rebuild, scoring, export, rescore, subset run, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
run.py postal-universe required --confirm-postal-universe, but direct execution of pipeline.postal_universe could still write processed postal-universe artifacts and could fetch missing source inputs with --download-missing.

pipeline.postal_universe now requires --confirm-postal-universe before build_universe() runs. Confirmed calls still hit the existing numeric-version and no-overwrite guards before source loading.
```

## Verification

```text
uv run pytest tests/test_postal_universe.py tests/test_run.py -q
........................................................................ [ 94%]
....                                                                     [100%]
76 passed in 15.79s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
585 tests collected in 17.34s
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

1. `pipeline.postal_universe` needed a module-owned confirmation because it can write processed universe artifacts and can download missing source inputs outside `run.py`.
2. The unconfirmed direct build rejection now happens before `build_universe()`, so accidental invocation fails before source loading, downloads, or artifact writes.
3. The collected test count moved from 584 to 585 because P758 adds one net postal-universe CLI confirmation test and executes no universe build or input download.

## DISAGREEMENTS

1. None.
