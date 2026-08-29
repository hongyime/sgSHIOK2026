# P857 Recent-Source Labels

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Postal-specific missing-address caveats now label the parenthesized source as a public-source sample or address-candidate sample rather than geocoded rows or proxy rows.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:51:37
   Duration  4.54s (transform 1.44s, setup 0ms, import 1.85s, tests 1.22s, environment 1ms)
```

### rg -n "geocoded rows|proxy rows|public-source sample|address-candidate sample" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:103:const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "P19 v2 28 Aug 2026 public-source sample";
C:\sgSHIOK2026\web\app\page.tsx:143:  "521400": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:144:  "522400": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:145:  "523400": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:146:  "762936": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:147:  "763936": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:148:  "764936": "2021-2026 HDB public-source sample",
C:\sgSHIOK2026\web\app\page.tsx:149:  "378720": "2021-2026 MCST address-candidate sample",
C:\sgSHIOK2026\web\app\page.tsx:150:  "935456": "2021-2026 MCST address-candidate sample",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:      "No OneMap address result found for this search. Try a 6-digit postal code. The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:202:      "The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a measured full-universe gap or approval to promote v2."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:214:  it("renders the current public-source sample in data limits", () => {
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:220:    expect(html).toContain("P19 v2 28 Aug 2026 public-source sample");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:247:    expect(html).not.toContain("16 Aug 2026 public-source sample");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:454:      "Postal 560231 is outside the published shelter-map data tied to the June 2020 address list; the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:463:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and the P19 v2 28 Aug 2026 public-source sample found 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:506:      "Postal 521400 is outside the published shelter-map data tied to the June 2020 address list; this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (2021-2026 HDB public-source sample)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:509:      "No shelter-map walk is published for this postal; the published shelter-map data is tied to the June 2020 address list, and this postal is one of the 6 coordinate-backed HDB rows missing from the June 2020 address list in the P19 v2 28 Aug 2026 public-source sample (2021-2026 HDB public-source sample)."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:512:    expect(hdbHtml).not.toContain("geocoded rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:290:    expect(source).toContain('const RECENT_PUBLIC_SOURCE_SAMPLE_LABEL = "P19 v2 28 Aug 2026 public-source sample";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:297:    expect(source).not.toContain("unvalidated MCST proxy rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:305:    expect(source).toContain('"521400": "2021-2026 HDB public-source sample"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:306:    expect(source).not.toContain("HDB 2021-2026 geocoded rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:307:    expect(source).not.toContain("MCST 2021-2026 proxy rows");
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
exit_code=1
```

### git check-ignore -v qa/verification/P857-recent-source-labels.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The HDB missing-address caveat still exposed `geocoded rows` in browser copy, and the shared source-label map still carried `MCST proxy rows` labels even though MCST rows render through the address-warning path.

## DISAGREEMENTS

1. None.
