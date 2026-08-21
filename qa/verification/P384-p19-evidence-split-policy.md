# P384 P19 Evidence Split Source Policy Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
73f3d6a7ad22eac48c6f43b9506eb096c18f52c7
73f3d6a7ad22eac48c6f43b9506eb096c18f52c7	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence Path Ignore Check

```powershell
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P384-p19-evidence-split-policy.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Batch Plan Evidence Split

```powershell
PS C:\sgSHIOK2026> uv run python -c "import json; from pipeline.batch_plan import build_batch_plan; ok, report = build_batch_plan(mode='candidate_full_registered'); print(json.dumps(report['source_policy']['recent_public_source_gap_sample']['evidence_split'], indent=2, sort_keys=True)); print('ok=' + str(ok).lower())"
{
  "confirmed_missing_address_rows": 6,
  "coordinate_backed_hdb_missing_rows": 6,
  "source_quality_warning_rows": 2,
  "unvalidated_mcst_proxy_rows": 2
}
ok=true
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 35 items

tests\test_batch_plan.py ..........                                      [ 28%]
tests\test_production_readiness.py .........................             [100%]

======================= 35 passed in 127.71s (0:02:07) ========================
```

## Repo Integrity

```powershell
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Checks

```powershell
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml; Write-Output "weights_diff_exit=$LASTEXITCODE"; git diff -- checksums.json; Write-Output "checksums_diff_exit=$LASTEXITCODE"; git diff -- web/public/data; Write-Output "public_data_diff_exit=$LASTEXITCODE"
weights_diff_exit=0
checksums_diff_exit=0
public_data_diff_exit=0
```

## Findings

1. Before P384, source-policy consumers had `missing_rows: 8` plus detailed HDB/MCST blocks, but not a first-class evidence classification.
2. The policy now exposes the exact evidence split that product copy and status output rely on: 6 confirmed/coordinate-backed HDB rows and 2 unvalidated/source-quality MCST rows.
3. Batch-plan and production-readiness exact-object tests now pin the structured split.

## Disagreements

1. None.
