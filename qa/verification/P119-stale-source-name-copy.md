# P119 Stale Source Name Copy

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public data write, deployment, or locked weight change.

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Check Ignore

```text
exit=1
```

## Change

The title-card source freshness line now names the six stale sources instead of grouping them as vague greenery/boundary references.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index b7f5bd5..4c8f6f1 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -2010,7 +2010,7 @@ export default function Home() {
               Recent public-sample check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals.
             </p>
             <p className={styles.freshnessLine}>
-              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references.
+              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale: traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers.
             </p>
             {scoreCoverageLine && <p className={styles.coverageLine}>{scoreCoverageLine}</p>}
             <p className={styles.sourceLine}>
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 410ca16..8a3a622 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -57,9 +57,10 @@ describe("score card copy", () => {
       "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
     );
     expect(source).toContain(
-      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references."
+      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale: traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers."
     );
     expect(source).not.toContain("1 unknown-age; stale sources");
+    expect(source).not.toContain("some greenery and boundary references");
     expect(source).not.toContain(
       "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
     );
```

## Search

```text
web/app/page.tsx:2013:              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale: traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers.
web/lib/__tests__/score-card-copy.test.ts:60:      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale: traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees and heritage road green buffers."
web/lib/__tests__/score-card-copy.test.ts:63:    expect(source).not.toContain("some greenery and boundary references");
web/lib/__tests__/score-card-copy.test.ts:65:      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:24:21
   Duration  525ms (transform 70ms, setup 0ms, import 90ms, tests 32ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:24:29
   Duration  5.50s (transform 5.60s, setup 0ms, import 6.61s, tests 6.74s, environment 9ms)
```

## Safety Checks

```text
git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0
```

```text
git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0
```

```text
python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Findings

1. The title-card freshness disclosure still grouped the six stale sources into generic categories. P119 names the exact stale sources recorded in `.agents/STATE.md` and prior freshness evidence.

## Disagreements

1. None.
