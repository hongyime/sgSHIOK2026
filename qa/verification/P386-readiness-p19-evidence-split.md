# P386 Readiness P19 Evidence Split Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
c637b418252cc46c5afff2c5e90d9b70d56885a8
c637b418252cc46c5afff2c5e90d9b70d56885a8	refs/heads/main
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
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P386-readiness-p19-evidence-split.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Readiness Feature Output

```powershell
PS C:\sgSHIOK2026> uv run python -c "import json; from scripts.production_readiness import readiness_features; f=readiness_features(); print(json.dumps(f['recent_public_source_gap_evidence_split'], indent=2, sort_keys=True))"
{
  "confirmed_missing_address_rows": 6,
  "coordinate_backed_hdb_missing_rows": 6,
  "source_quality_warning_rows": 2,
  "unvalidated_mcst_proxy_rows": 2
}
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 25 items

tests\test_production_readiness.py .........................             [100%]

============================= 25 passed in 44.49s =============================
```

## Findings

1. Before P386, production readiness carried the P19 evidence split only inside the nested source-policy block.
2. Readiness now exposes `features.recent_public_source_gap_evidence_split` directly for operator and script consumers.
3. The direct field matches the source-policy and status split: 6 confirmed/coordinate-backed HDB rows, 2 unvalidated/source-quality MCST rows.

## Disagreements

1. None.
