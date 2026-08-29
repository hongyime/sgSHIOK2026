# P906 OneMap Missing Postal Error

## Scope

Change the selected OneMap result error from internal `usable postal code` language to a recovery instruction.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=dea6d66ce9094c59e84e444e3bc71d3c08d2dcea
REMOTE=dea6d66ce9094c59e84e444e3bc71d3c08d2dcea	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:212:    return `No OneMap match for this search. Try a 6-digit postal code. ${noSearchResultBundleCaveat()}`;
C:\sgSHIOK2026\web\app\page.tsx:379:          <p>No OneMap match found. Try a 6-digit postal code.</p>
C:\sgSHIOK2026\web\app\page.tsx:2184:      setError("Selected OneMap result has no usable postal code.");
C:\sgSHIOK2026\web\app\page.tsx:2323:        setError("OneMap search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\app\page.tsx:2326:      setError(err instanceof Error ? err.message : "Failed to search OneMap address.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:      "No OneMap match for this search. Try a 6-digit postal code. The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:199:    expect(noResultsHtml).toContain("No OneMap match found.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:268:    expect(source).toContain("Selected OneMap result has no usable postal code.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:269:    expect(source).not.toContain("Selected result has no usable postal code.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:270:    expect(source).toContain("OneMap search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:271:    expect(source).not.toContain("Search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:272:    expect(source).toContain("Failed to search OneMap address.");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:28:02
   Duration  16.22s (transform 4.82s, setup 0ms, import 6.19s, tests 5.67s, environment 3ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
```

Exit code: 0.

## FINDINGS

1. The selected-result error identified the validation failure but did not tell the user how to recover.

## DISAGREEMENTS

1. None.
