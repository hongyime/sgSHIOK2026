# P765 legacy data.gov.sg probe confirmation guards

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No data.gov.sg HTTP call, DataMall call, payload fetch, raw mutation, export, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
pipeline.verify_datagov_ids, pipeline.inspect_datagov, pipeline.resolve_datagov, and pipeline.resolve_datagov_ids were legacy direct live HTTP probes with no approval flag.

Each script now requires --confirm-datagov-probe before any HTTP request. The underlying helper functions remain importable for approved use and tests.
```

## Verification

```text
uv run pytest tests/test_datagov_probe_guards.py -q
............                                                             [100%]
12 passed in 1.40s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
608 tests collected in 9.05s
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

1. Four legacy data.gov.sg helper scripts needed direct confirmations because each can call live external endpoints outside `run.py`.
2. Unconfirmed direct execution now fails before any HTTP request.
3. The collected test count moved from 596 to 608 because P765 adds twelve data.gov.sg probe guard tests and executes no live probe.

## DISAGREEMENTS

1. None.
