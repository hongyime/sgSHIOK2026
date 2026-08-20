# P232 Freshness Snapshot Wording

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-QA write, source-config policy change, raw-manifest change, or locked-weights edit was performed.

## Commands

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  05:50:13
   Duration  1.39s (transform 174ms, setup 0ms, import 219ms, tests 80ms, environment 0ms)
```

```text
C:\sgSHIOK2026\web\app\page.tsx:2045:              Data freshness at latest manifest-only check: 12 sources current, oldest current source was NParks Leaf Area Index at 112.5 days old; 6 stale, 2 manual, and 1 candidate address source with unknown age. Stale sources are traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers.
C:\sgSHIOK2026\decisions.md:627:The first-view data freshness sentence now says the 12-current/6-stale/2-manual/1-unknown-age counts are from the latest manifest-only check, and says the oldest current source was 112.5 days old at that check. This avoids presenting a fixed historical age as a live freshness age. This is browser copy and test coverage only; it does not alter freshness classification, raw manifests, source configs, data fetching, scoring, exports, public data, deployment, or locked weights.
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:126:      "Data freshness at latest manifest-only check: 12 sources current, oldest current source was NParks Leaf Area Index at 112.5 days old; 6 stale, 2 manual, and 1 candidate address source with unknown age. Stale sources are traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:129:      "Data freshness: 12 sources current, oldest current source is NParks Leaf Area Index at 112.5 days old;"
```

```text
exit=1
```

```text
repo_integrity=ok
exit=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              | 3 +++
 web/app/page.tsx                          | 2 +-
 web/lib/__tests__/score-card-copy.test.ts | 5 ++++-
 3 files changed, 8 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The title-card freshness line used a fixed `112.5 days old` value without saying it came from a manifest-only snapshot, so it could read as a live age.
2. The line now says `Data freshness at latest manifest-only check` and `oldest current source was ...`, preserving the measured counts while making the snapshot nature explicit.

## DISAGREEMENTS

1. None.
