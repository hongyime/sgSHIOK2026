# P846 Shelter-Source Listing Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The browser Covered Linkway freshness note now describes the dated check as a source-listing check instead of a DataMall discovery-URL check.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  10:58:16
   Duration  7.17s (transform 2.23s, setup 0ms, import 2.78s, tests 1.76s, environment 1ms)
```

### rg -n "discovery-only DataMall check|Traffic Signals URLs still match|source-listing check|traffic-signal listings" web\app web\lib\__tests__

```text
web\lib\__tests__\score-card-copy.test.ts:369:      "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched frozen v1; stale payload ages still require a new numbered input version before any refresh."
web\lib\__tests__\score-card-copy.test.ts:372:    expect(source).toContain("traffic-signal listings still matched frozen v1");
web\lib\__tests__\score-card-copy.test.ts:373:    expect(source).not.toContain("Traffic Signals URLs still match frozen v1");
web\lib\__tests__\score-card-copy.test.ts:374:    expect(source).not.toContain("discovery-only DataMall check");
web\app\page.tsx:115:  "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched frozen v1; stale payload ages still require a new numbered input version before any refresh.";
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=0
```

### git check-ignore -v qa/verification/P846-shelter-source-listing-copy.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The Covered Linkway freshness disclosure still exposed API discovery mechanics in user-facing copy even though the product question is whether the frozen shelter sources are stale.

## DISAGREEMENTS

1. None.
