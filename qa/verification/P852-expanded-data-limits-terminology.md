# P852 Expanded Data-Limits Terminology

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Expanded data-limits copy now says frozen v1 data, June 2020 OneMap-derived address seed, and stale source data instead of frozen v1 bundle, postal-universe seed, and stale payload ages.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:26:06
   Duration  12.37s (transform 4.23s, setup 0ms, import 5.41s, tests 3.00s, environment 2ms)
```

### rg -n "postal-universe seed|frozen v1 bundle in place|stale payload ages|OneMap-derived address seed|frozen v1 data in place|stale source data" web\app web\lib\__tests__

```text
C:\sgSHIOK2026\web\app\page.tsx:112:  "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new versioned inputs instead of changing the frozen v1 data in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";
C:\sgSHIOK2026\web\app\page.tsx:115:  "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched frozen v1; stale source data still requires a new numbered input version before any refresh.";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:236:    expect(html).toContain("source refreshes use new versioned inputs instead of changing the frozen v1 data in place");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:239:      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed"
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:241:    expect(html).not.toContain("postal-universe seed");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:319:      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:321:    expect(source).not.toContain("postal-universe seed");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:328:    expect(source).toContain("source refreshes use new versioned inputs instead of changing the frozen v1 data in place");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:329:    expect(source).not.toContain("source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:376:      "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched frozen v1; stale source data still requires a new numbered input version before any refresh."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:378:    expect(source).not.toContain("stale payload ages");
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

### git check-ignore -v qa/verification/P852-expanded-data-limits-terminology.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. Expanded data-limits copy still exposed implementation terms in the browser surface even after the collapsed summary was made user-facing.

## DISAGREEMENTS

1. None.
