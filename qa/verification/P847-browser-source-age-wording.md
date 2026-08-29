# P847 Browser Source-Age Wording

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The browser source-age summary now says the dated snapshot was not a live source refresh instead of saying it was manifest-only and no upstream URLs were probed.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  11:00:54
   Duration  5.69s (transform 1.63s, setup 0ms, import 2.12s, tests 1.82s, environment 1ms)
```

### rg -n "manifest-only check|No upstream URLs were probed|source-age check|not a live source refresh" web\app web\lib\__tests__

```text
web\app\page.tsx:109:  "Source-age snapshot: 28 Aug 2026 22:21 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh.";
web\app\page.tsx:112:  "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived postal-universe seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";
web\lib\__tests__\accessibility-render.test.tsx:226:      "Source-age snapshot: 28 Aug 2026 22:21 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh."
web\lib\__tests__\accessibility-render.test.tsx:228:    expect(html).not.toContain("Source-age snapshot: 28 Aug 2026 22:21 UTC manifest-only check");
web\lib\__tests__\accessibility-render.test.tsx:229:    expect(html).not.toContain("No upstream URLs were probed.");
web\lib\__tests__\accessibility-render.test.tsx:232:      "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold"
web\lib\__tests__\accessibility-render.test.tsx:241:    expect(html).not.toContain("zero-mutation source-age check before release work");
web\lib\__tests__\accessibility-render.test.tsx:243:    expect(html).not.toContain("Data freshness: 28 Aug 2026 11:52 UTC manifest-only check");
web\lib\__tests__\score-card-copy.test.ts:309:      "Source-age snapshot: 28 Aug 2026 22:21 UTC source-age check; 11 sources were current, 9 stale, 3 manual, and 1 unknown-age candidate. This was not a live source refresh."
web\lib\__tests__\score-card-copy.test.ts:311:    expect(source).not.toContain("Source-age snapshot: 28 Aug 2026 22:21 UTC manifest-only check");
web\lib\__tests__\score-card-copy.test.ts:312:    expect(source).not.toContain("No upstream URLs were probed.");
web\lib\__tests__\score-card-copy.test.ts:328:      "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold"
web\lib\__tests__\score-card-copy.test.ts:332:    expect(source).not.toContain("zero-mutation source-age check before release work");
web\lib\__tests__\score-card-copy.test.ts:340:    expect(source).not.toContain("Data freshness at the 27 Aug 2026 UTC manifest-only check");
web\lib\__tests__\score-card-copy.test.ts:341:    expect(source).not.toContain("Data freshness at the 28 Aug 2026 08:05 UTC manifest-only check");
web\lib\__tests__\score-card-copy.test.ts:342:    expect(source).not.toContain("Data freshness: 28 Aug 2026 11:52 UTC manifest-only check");
web\lib\__tests__\score-card-copy.test.ts:343:    expect(source).not.toContain("Data freshness at the 28 Aug 2026 10:27 UTC manifest-only check: 9 sources current");
web\lib\__tests__\score-card-copy.test.ts:344:    expect(source).not.toContain("Data freshness at the 21 Aug 2026 UTC manifest-only check: 12 sources current, 6 stale");
web\lib\__tests__\score-card-copy.test.ts:351:    expect(source).not.toContain("No upstream URLs were probed.");
web\lib\__tests__\score-card-copy.test.ts:354:      "Data freshness at latest manifest-only check:"
web\lib\__tests__\score-card-copy.test.ts:356:    expect(source).not.toContain("Data freshness at the 21 Aug 2026 manifest-only check");
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

### git check-ignore -v qa/verification/P847-browser-source-age-wording.md; Write-Output "exit_code=$LASTEXITCODE"

```text
exit_code=1
```

## FINDINGS

1. The source-age disclosure still described internal verification mechanics (`manifest-only`, `upstream URLs`) in the product UI. The limitation is now stated as a user-facing freshness fact.

## DISAGREEMENTS

1. None.
