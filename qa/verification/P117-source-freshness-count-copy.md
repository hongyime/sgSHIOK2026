# P117 Source Freshness Count Copy

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

The title-card source freshness line now reports the measured audit counts: `12 current, 6 stale, 2 manual, 1 unknown-age`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 3e2f78f..a26c6ea 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -2010,7 +2010,7 @@ export default function Home() {
               Recent public-sample check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals.
             </p>
             <p className={styles.freshnessLine}>
-              Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references.
+              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references.
             </p>
             {scoreCoverageLine && <p className={styles.coverageLine}>{scoreCoverageLine}</p>}
             <p className={styles.sourceLine}>
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index dd564d2..21b77fa 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -57,6 +57,9 @@ describe("score card copy", () => {
       "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
     );
     expect(source).toContain(
+      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references."
+    );
+    expect(source).not.toContain(
       "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
     );
     expect(source).not.toContain("6 supporting sources are stale.");
```

## Search

```text
web/app/page.tsx:2013:              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references.
web/lib/__tests__/score-card-copy.test.ts:60:      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references."
web/lib/__tests__/score-card-copy.test.ts:63:      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:17:24
   Duration  629ms (transform 87ms, setup 0ms, import 113ms, tests 38ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:17:36
   Duration  5.77s (transform 4.18s, setup 0ms, import 5.25s, tests 8.11s, environment 10ms)
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

1. The browser source-freshness line used a qualitative summary even though P76 had already measured concrete freshness counts. P117 surfaces those counts in the title card.

## Disagreements

1. None.
