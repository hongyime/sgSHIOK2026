# P382 P19 Aggregate Caveat Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
f5307b36b07d910e2b918a695e4785502c5aaa1c
f5307b36b07d910e2b918a695e4785502c5aaa1c	refs/heads/main
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
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P382-p19-aggregate-caveat.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Stale Wording Scan

```powershell
PS C:\sgSHIOK2026> rg -n "8 missing rows out of 976 \(0\.82%\) HDB completion and MCST proxy rows|8 missing rows out of 976 HDB completion and MCST proxy rows|6 coordinate-backed HDB missing rows" C:\sgSHIOK2026\web C:\sgSHIOK2026\tests C:\sgSHIOK2026\README.md C:\sgSHIOK2026\CLAUDE.md C:\sgSHIOK2026\scripts\production_readiness.py
C:\sgSHIOK2026\scripts\production_readiness.py:994:                "universe; P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated "
C:\sgSHIOK2026\CLAUDE.md:10:OneMap-derived postal scrape. P19 found 6 coordinate-backed HDB missing rows plus
C:\sgSHIOK2026\tests\test_production_readiness.py:463:        "P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%)"
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:170:      "No OneMap address result found for this search. Try a 6-digit postal code. Separately, the frozen shelter-map bundle's recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:175:      "Separately, the frozen shelter-map bundle&#x27;s recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:318:      "Postal 560231 is outside the shelter-map bundle tied to the frozen June 2020 address universe; the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:325:      "No shelter-map walk is published for this postal; this shelter-map bundle is tied to the frozen June 2020 address universe, and the recent public-source check found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals."
C:\sgSHIOK2026\web\app\page.tsx:102:  "6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals";
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:171:      "6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) 2021-2026 public-source rows with postals"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:173:    expect(source).not.toContain("8 missing rows out of 976 HDB completion and MCST proxy rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:174:    expect(source).not.toContain("8 missing rows out of 976 (0.82%) HDB completion and MCST proxy rows");
C:\sgSHIOK2026\tests\test_readme.py:24:        "6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%)"
C:\sgSHIOK2026\tests\test_readme.py:27:    assert "8 missing rows out of 976 HDB completion and MCST proxy rows" not in normalized
C:\sgSHIOK2026\tests\test_agent_docs.py:22:        "P19 found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%)"
C:\sgSHIOK2026\tests\test_agent_docs.py:25:    assert "P19 found 8 missing rows out of 976 HDB completion and MCST proxy rows" not in normalized
```

## Focused Python Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_readme.py tests/test_agent_docs.py tests/test_production_readiness.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 30 items

tests\test_readme.py ....                                                [ 13%]
tests\test_agent_docs.py .                                               [ 16%]
tests\test_production_readiness.py .........................             [100%]

======================= 30 passed in 166.18s (0:02:46) ========================
```

## Focused Web Tests

```powershell
PS C:\sgSHIOK2026> npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  36 passed (36)
   Start at  16:58:38
   Duration  2.70s (transform 1.31s, setup 0ms, import 1.70s, tests 453ms, environment 1ms)
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

1. The old aggregate copy was numerically true but too coarse after P377-P379, because it grouped coordinate-backed HDB rows with unvalidated MCST proxy rows.
2. Browser, README, CLAUDE, and readiness copy now preserve the 8-of-976 measurement while naming the split: 6 coordinate-backed HDB missing rows and 2 unvalidated MCST proxy rows.
3. Negative tests still reject the pre-rate and pre-proxy caveat strings.

## Disagreements

1. None.
