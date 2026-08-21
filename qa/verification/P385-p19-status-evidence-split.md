# P385 P19 Status Evidence Split Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
a22d472c41bdbe63aea6f2b0f0ab8aa38d64ae08
a22d472c41bdbe63aea6f2b0f0ab8aa38d64ae08	refs/heads/main
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
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P385-p19-status-evidence-split.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_analysis_scripts.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_analysis_scripts.py .....                                     [100%]

============================= 5 passed in 10.04s ==============================
```

## Live Status Evidence Split

```powershell
PS C:\sgSHIOK2026> uv run python -c "import json; from scripts.analysis import p19_universe_gap_measurement as p19; report = p19.cache_status_report(); print(json.dumps(report['evidence_split'], indent=2, sort_keys=True)); print('will_call_apis=' + str(report['will_call_apis']).lower()); print('will_write_files=' + str(report['will_write_files']).lower())"
{
  "confirmed_missing_address_rows": 6,
  "coordinate_backed_hdb_missing_rows": 6,
  "detail_exists": true,
  "source_quality_warning_rows": 2,
  "unvalidated_mcst_proxy_rows": 2
}
will_call_apis=false
will_write_files=false
```

## Findings

1. Before P385, `p19-gap-status` exposed enough nested data to infer the P19 split, but not the same first-class `evidence_split` already used by source policy.
2. The safe status command now reports the split directly: 6 coordinate-backed/confirmed HDB missing rows and 2 unvalidated/source-quality MCST proxy rows.
3. The split is derived from existing cached P19/P379 status blocks and preserves the no-API/no-write boundary.

## Disagreements

1. None.
