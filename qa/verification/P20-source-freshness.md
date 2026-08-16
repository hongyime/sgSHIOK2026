# P20 Source Freshness And Lamp Overlay Gate

## Working Root

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
46a1f61da08fe185375c8907a26fac7e89454243
46a1f61da08fe185375c8907a26fac7e89454243	refs/heads/main
```

## Evidence Path Ignore Check

```text
exit=1
```

## Lamp Source Shape

```text
lamp_path=C:\sgSHIOK2026\raw\2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29\lamp_posts.geojson
lamp_bytes=41907845
lamp_feature_count=126144
lamp_geometry_types={'Point': 126144}
```

## Active Browser Bundle Contents

```text

Mode  Length Name
----  ------ ----
d----        geom
d----        scores
d----        transit
-a--- 13626  manifest.json
-a--- 3281   manifest.json.gz
```

## Local Freshness Policy Report

```text
freshness_now=2026-08-16T00:00:00+00:00
source_count=21
freshness_counts=current:12,manual:2,stale:6,unknown_age:1
[traffic_signals] Traffic Signals: STALE — last_modified age 162.6d exceeds 120d threshold (quarterly)
[planning_area_boundary] Planning Area Boundaries (MP2019 No Sea): STALE — last_modified age 253.9d exceeds 120d threshold (quarterly)
[nparks_nature_ways] NParks Nature Ways: STALE — last_modified age 121.9d exceeds 120d threshold (quarterly)
[nparks_tracks] NParks Tracks: STALE — last_modified age 233.9d exceeds 120d threshold (quarterly)
[nparks_heritage_trees] NParks Heritage Trees: STALE — last_modified age 136.9d exceeds 120d threshold (quarterly)
[nparks_heritage_road_green_buffers] NParks Heritage Road Green Buffers: STALE — last_modified age 195.9d exceeds 120d threshold (quarterly)
```

## Orphan Source Freshness

```text
[lamp_posts] Lamp Posts: freshness current (quarterly)
age_days=39.912
stale_after_days=120
[leaf_area_index] NParks Leaf Area Index: freshness current (quarterly)
age_days=107.671
stale_after_days=120
[covered_linkway] Covered Linkway: freshness current (quarterly)
age_days=20.78
stale_after_days=120
```

## Python Tests

```text
...................                                                      [100%]
19 passed in 7.07s
```

## Web Tests

Targeted score-card copy test:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  10:18:50
   Duration  5.72s (transform 185ms, setup 0ms, import 230ms, tests 50ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts
```

Full web suite first run:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/typescript-contract.test.ts (1 test | 1 failed) 8276ms
     × type-checks rank payload projections 8260ms

 Test Files  1 failed | 20 passed (21)
      Tests  1 failed | 104 passed (105)
   Start at  10:20:03
   Duration  13.41s (transform 11.94s, setup 0ms, import 27.15s, tests 13.65s, environment 18ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/typescript-contract.test.ts > typescript contracts > type-checks rank payload projections
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/typescript-contract.test.ts:6:3
      4|
      5| describe("typescript contracts", () => {
      6|   it("type-checks rank payload projections", () => {
       |   ^
      7|     const webRoot = join(__dirname, "../..");
      8|     const tscBin = join(webRoot, "node_modules", "typescript", "bin", …

⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

Rerun of the failing web test:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  10:20:29
   Duration  3.51s (transform 95ms, setup 0ms, import 140ms, tests 2.51s, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/typescript-contract.test.ts
```

Direct TypeScript command matching the contract test:

```text
exit=0
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Protected File Check

```text
exit=0
```

## FINDINGS

1. Lamp posts cannot be shipped as a React-only overlay from the current tracked repo state. The source is a 41,907,845-byte raw GeoJSON with 126,144 point features, while the active browser bundle contains only `geom`, `scores`, `transit`, and manifest files.
2. The new source freshness policy reports six stale local manifest sources as of 2026-08-16 under the configured quarterly threshold: `traffic_signals`, `planning_area_boundary`, `nparks_nature_ways`, `nparks_tracks`, `nparks_heritage_trees`, and `nparks_heritage_road_green_buffers`.
3. `lamp_posts`, `leaf_area_index`, and `covered_linkway` are current under the quarterly freshness policy on 2026-08-16. Lamp posts remain unconsumed despite being current.
4. The UI now states that the address universe is the frozen v1 2020 SLA-derived postal set, so users see the known completion-gap limitation without waiting for a v2 universe build.
5. The full web suite can still time out in the TypeScript-contract test when run cold with the default 5000 ms Vitest timeout; the same test passed when rerun alone, and the direct TypeScript compiler invocation used by that test exited 0.

## DISAGREEMENTS

1. I did not generate a new `web/public/data` lamp artifact in this phase. That would be the right path for a real overlay, but it is data-publication work in a gitignored artifact tree, not a tracked React-only change.
2. I did not make staleness fail `run.py check`. A stale source is a refresh-action warning; it is not the same class of defect as a hash mismatch or changed upstream payload.
