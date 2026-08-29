# P853 MCST Address-Warning Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Recent-source caveats now describe MCST cases as unverified address candidates and address-quality warnings instead of MCST proxy rows and source-quality evidence.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:29:43
   Duration  3.97s (transform 1.36s, setup 0ms, import 1.75s, tests 899ms, environment 1ms)
```

### rg -n "unvalidated MCST proxy|source-quality evidence|source-quality warnings|unverified MCST address|address-quality warning" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:102:  "6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2";
C:\sgSHIOK2026\web\app\page.tsx:155:    "this postal appears only in an unverified MCST address candidate; OneMap Search for CANAAN returned candidate postal 387720, so recorded 378720 is an address-quality warning rather than a confirmed missing address",
C:\sgSHIOK2026\web\app\page.tsx:157:    "this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:      "No OneMap address result found for this search. Try a 6-digit postal code. The published shelter-map data is tied to the frozen June 2020 address universe. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:202:      "The published shelter-map data is tied to the frozen June 2020 address universe. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:453:      "Postal 560231 is outside the published shelter-map data tied to the frozen June 2020 address universe; the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:462:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the frozen June 2020 address universe, and the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:513:      "Postal 935456 is outside the published shelter-map data tied to the frozen June 2020 address universe; this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:516:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the frozen June 2020 address universe, and this postal appears only in an unverified MCST address candidate; OneMap Search did not locate MYRA at the recorded postal, so it is an address-quality warning rather than a confirmed missing address."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:518:    expect(mcstHtml).not.toContain("unvalidated MCST proxy row");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:519:    expect(mcstHtml).not.toContain("source-quality evidence");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:295:      "6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:297:    expect(source).not.toContain("unvalidated MCST proxy rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:298:    expect(source).not.toContain("source-quality warnings");
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=0
```

### git check-ignore -v qa/verification/P853-mcst-address-warning-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The P19 recent-source caveat still used data-engineering terms (`MCST proxy row`, `source-quality evidence`) in browser copy shown to address-search users.

## DISAGREEMENTS

1. None.
