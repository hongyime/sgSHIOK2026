# P910 OneMap No-Results Recovery

## Scope

Change OneMap no-results copy to suggest another address spelling or a 6-digit postal code.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=2b6015ee992cda14a9422709ee686457e0f22850
REMOTE=2b6015ee992cda14a9422709ee686457e0f22850	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:212:    return `No OneMap match for this search. Try a 6-digit postal code. ${noSearchResultBundleCaveat()}`;
C:\sgSHIOK2026\web\app\page.tsx:379:          <p>No OneMap match found. Try a 6-digit postal code.</p>
C:\sgSHIOK2026\web\app\page.tsx:2326:      setError(err instanceof Error ? err.message : "OneMap address search failed. Try a 6-digit postal code or search again.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:      "No OneMap match for this search. Try a 6-digit postal code. The published shelter-map data is tied to the June 2020 address list. P19 v2 28 Aug 2026 public-source sample: 6 coordinate-backed HDB missing rows (SUN PLAZA SPRING and YISHUN BEACON, three postals each) plus 2 unverified MCST address candidates (CANAAN and MYRA) out of 976 sampled 2021-2026 public-source rows with postals: 0.61% confirmed, or 0.82% including address-quality warnings. This is sampled evidence, not a complete missing-address count or approval to replace the June 2020 address list."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:199:    expect(noResultsHtml).toContain("No OneMap match found.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:200:    expect(noResultsHtml).toContain("Try a 6-digit postal code");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:211:    expect(noResultsHtml).not.toContain("Try a 6-digit postal code; the frozen shelter-map bundle");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:43:54
   Duration  17.45s (transform 5.96s, setup 0ms, import 7.23s, tests 4.60s, environment 2ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
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

1. The OneMap no-results state only suggested direct postal-code entry, even though changing the address spelling is also a valid recovery path.

## DISAGREEMENTS

1. None.
