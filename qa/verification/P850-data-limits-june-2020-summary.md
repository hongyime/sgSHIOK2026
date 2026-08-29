# P850 Data-Limits June 2020 Summary

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The collapsed Data limits summary now says June 2020 addresses instead of frozen v1 addresses, while the expanded detail keeps the frozen-v1 versioning caveat.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:16:42
   Duration  5.15s (transform 1.63s, setup 0ms, import 2.10s, tests 1.36s, environment 1ms)
```

### rg -n "Data limits: June 2020 addresses|Data limits: frozen v1 addresses|Address universe: frozen v1" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:217:    expect(html).toContain("Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:218:    expect(html).not.toContain("Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:219:    expect(html).not.toContain("Data limits: frozen v1 addresses; incomplete locked scores");
C:\sgSHIOK2026\web\app\page.tsx:2446:          <summary>Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores</summary>
C:\sgSHIOK2026\web\app\page.tsx:2448:            Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape.
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:283:      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:406:      "<summary>Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores</summary>",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:407:      "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape.",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:422:    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; roughly 1 in 4 lack full locked scores</summary>");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:423:    expect(source).not.toContain("<summary>Data limits: frozen v1 addresses; incomplete locked scores</summary>");
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

### git check-ignore -v qa/verification/P850-data-limits-june-2020-summary.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The collapsed data-limits summary exposed internal versioning language before the user saw the concrete age of the address universe.

## DISAGREEMENTS

1. None.
