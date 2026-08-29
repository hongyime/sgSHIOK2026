# P904 Preview Badge Published Shelter-Map Data

## Scope

Change the live OneMap preview reason badge from `Not in published data` to `Not in published shelter-map data`.

## Commands

### Root and remote

```text
HEAD=299641e5c5c5dae3713180e9853c8164a1797e4a
REMOTE=299641e5c5c5dae3713180e9853c8164a1797e4a	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:112:  "At the 28 Aug 2026 source-age check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new dated input versions instead of changing published data in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived address seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";
C:\sgSHIOK2026\web\app\page.tsx:115:  "Covered Linkway follows a quarterly 120-day freshness threshold; published data uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched the published data; stale source data still requires a new dated input version before any refresh.";
C:\sgSHIOK2026\web\app\page.tsx:861:    return ["Shelter-map evidence preview", "Not in published data"];
C:\sgSHIOK2026\web\app\page.tsx:2402:              Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).toContain("source refreshes use new dated input versions instead of changing published data in place");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:421:    expect(html).toContain("Not in published data");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1301:    expect(html).not.toContain("the current published data has not scored it yet");
C:\sgSHIOK2026\web\lib\__tests__\data-base.test.ts:17:  it("documents the pinned published data bundle instead of a latest bundle", () => {
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:278:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:350:    expect(source).toContain("source refreshes use new dated input versions instead of changing published data in place");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:399:      "Covered Linkway follows a quarterly 120-day freshness threshold; published data uses the Mar 2026 LTA geospatial listing. A 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched the published data; stale source data still requires a new dated input version before any refresh."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:427:      "Shelter-map evidence as of {formatDataDate(manifest)}; published data built {formatGeneratedDate(manifest)}",
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:691:    expect(source).toContain("Not in published data");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:19:35
   Duration  4.67s (transform 1.41s, setup 0ms, import 1.83s, tests 1.32s, environment 1ms)
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

1. The live-preview badge used generic `data` language even though the browser now consistently distinguishes published shelter-map data from live OneMap preview evidence.

## DISAGREEMENTS

1. None.
