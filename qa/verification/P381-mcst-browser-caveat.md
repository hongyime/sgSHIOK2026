# P381 MCST Proxy Browser Caveat Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
f5adb68dcdda78b0e897561abd9d52a388dd4382
f5adb68dcdda78b0e897561abd9d52a388dd4382	refs/heads/main
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
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P381-mcst-browser-caveat.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Focused Python Drift Guard

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_batch_plan.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 10 items

tests\test_batch_plan.py ..........                                      [100%]

============================= 10 passed in 12.29s =============================
```

## Focused Web Render Test

```powershell
PS C:\sgSHIOK2026> npm --prefix web test -- accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  16:51:26
   Duration  16.31s (transform 8.36s, setup 0ms, import 10.30s, tests 1.28s, environment 1ms)
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

1. The browser previously treated MCST proxy postals the same as coordinate-backed HDB known misses by saying they were among the recent public-source postals missing from frozen v1.
2. After P379, that is too strong for MCST: MYRA was not located by OneMap Search and CANAAN's recorded postal conflicts with OneMap candidate postal 387720.
3. The browser now keeps confirmed missing-postal wording for HDB postals and uses unvalidated source-quality wording for MCST proxy postals.

## Disagreements

1. None.
