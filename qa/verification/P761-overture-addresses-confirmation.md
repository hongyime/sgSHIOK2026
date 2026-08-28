# P761 Overture direct-probe confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No Overture query, raw archive, candidate report write, GeoJSON write, export, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
pipeline.overture_addresses was a direct remote-probe/writer path. run.py required --confirm-overture-addresses, but direct module execution could query remote Overture data, write candidate reports/GeoJSON, and archive raw parquet evidence after only passing output preflight.

pipeline.overture_addresses now requires --confirm-overture-addresses before the remote query/report path runs. run.py forwards that module-owned confirmation instead of stripping it.
```

## Verification

```text
uv run pytest tests/test_overture_addresses.py tests/test_run.py -q
.....................................................................    [100%]
69 passed in 6.05s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
590 tests collected in 10.29s
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

1. `pipeline.overture_addresses` needed a module-owned confirmation because it can query remote Overture data and write candidate evidence outside `run.py`.
2. Existing no-overwrite preflight remains first; fresh-output invocations now fail at the approval boundary before remote queries, raw archives, report writes, or GeoJSON writes.
3. The collected test count moved from 588 to 590 because P761 adds two Overture CLI confirmation/forwarding tests and executes no remote Overture query.

## DISAGREEMENTS

1. None.
