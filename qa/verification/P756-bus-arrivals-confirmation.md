# P756 bus-arrivals module confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No bus-arrivals collection, DataMall call, ingest, refetch, input rebuild, scoring, export, rescore, subset run, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
run.py bus-arrivals required --confirm-bus-arrivals, but direct execution of pipeline.bus_arrivals collect could still call DataMall and append a JSONL snapshot with only --output.

pipeline.bus_arrivals now owns --confirm-bus-arrivals for collect, and run.py forwards the same confirmation flag instead of stripping it.
```

## Verification

```text
uv run pytest tests/test_bus_arrivals.py tests/test_run.py -q
...................................................................      [100%]
67 passed in 15.85s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
582 tests collected in 18.31s
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

1. `pipeline.bus_arrivals collect` needed a module-owned confirmation because it can call DataMall and append a snapshot outside `run.py`.
2. The unconfirmed collection rejection now happens before output-path checks and before any fetch call, so accidental direct invocation fails at the approval boundary first.
3. The collected test count moved from 581 to 582 because P756 adds one net bus-arrivals CLI confirmation test and executes no DataMall call.

## DISAGREEMENTS

1. None.
