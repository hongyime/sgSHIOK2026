# P766 legacy DataMall static parser confirmation guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No DataMall static page HTTP call, DataMall API call, payload fetch, raw mutation, export, scoring, rescore, subset run, ingest, refetch, input rebuild, OneMap collection, network build, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
pipeline.parse_static_datamall was a legacy direct live HTTP parser with no approval flag.

Direct execution now requires --confirm-datamall-static-parse before any HTTP request. The underlying parse_datamall_static_links() helper remains importable for approved use and tests.
```

## Verification

```text
uv run pytest tests/test_parse_static_datamall.py -q
...                                                                      [100%]
3 passed in 1.79s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
611 tests collected in 45.21s
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

1. `pipeline.parse_static_datamall` needed a direct confirmation because it can call the live LTA DataMall static-data page outside `run.py`.
2. Unconfirmed direct execution now fails before any HTTP request.
3. The collected test count moved from 608 to 611 because P766 adds three DataMall static parser guard tests and executes no live probe.

## DISAGREEMENTS

1. None.
