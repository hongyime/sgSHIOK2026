# P757 bus API direct-ingest confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No DataMall bus API ingest, bus-arrivals collection, ingest, refetch, input rebuild, scoring, export, rescore, subset run, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
pipeline.bus ingest could call DataMall, write raw/<sha>/bus_*.json payloads, and update raw/manifest.json without a module-owned confirmation.

pipeline.bus now requires --confirm-input-refresh for direct ingest and rejects unconfirmed calls before loading source config or fetching DataMall records.
```

## Verification

```text
uv run pytest tests/test_bus.py tests/test_fetch.py tests/test_run.py -q
........................................................................ [ 80%]
.................                                                        [100%]
89 passed in 14.64s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
584 tests collected in 51.75s
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

1. `pipeline.bus ingest` needed a module-owned confirmation because it can mutate `raw/` and `raw/manifest.json` outside `run.py`.
2. The unconfirmed direct ingest rejection now happens before source config loading, so accidental invocation fails before source selection, network calls, or raw writes.
3. The collected test count moved from 582 to 584 because P757 adds two bus CLI confirmation tests and executes no DataMall call.

## DISAGREEMENTS

1. None.
