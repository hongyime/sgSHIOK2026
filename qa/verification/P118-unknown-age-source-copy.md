# P118 Unknown-Age Source Copy

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

The title-card freshness line now says the one unknown-age source is a `candidate address source`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index a26c6ea..b7f5bd5 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -2010,7 +2010,7 @@ export default function Home() {
               Recent public-sample check: 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals.
             </p>
             <p className={styles.freshnessLine}>
-              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references.
+              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references.
             </p>
             {scoreCoverageLine && <p className={styles.coverageLine}>{scoreCoverageLine}</p>}
             <p className={styles.sourceLine}>
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 21b77fa..410ca16 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -57,8 +57,9 @@ describe("score card copy", () => {
       "Recent public-sample check: 8 missing rows out of 976 completions from 2021-2026 with postals."
     );
     expect(source).toContain(
-      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age; stale sources are traffic signals plus some greenery and boundary references."
+      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references."
     );
+    expect(source).not.toContain("1 unknown-age; stale sources");
     expect(source).not.toContain(
       "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
     );
```

## Search

```text
web/app/page.tsx:2013:              Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references.
web/lib/__tests__/score-card-copy.test.ts:60:      "Source freshness audit: 12 current, 6 stale, 2 manual, 1 unknown-age candidate address source; stale sources are traffic signals plus some greenery and boundary references."
web/lib/__tests__/score-card-copy.test.ts:62:    expect(source).not.toContain("1 unknown-age; stale sources");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:20:42
   Duration  1.78s (transform 198ms, setup 0ms, import 251ms, tests 82ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:20:56
   Duration  10.61s (transform 8.18s, setup 0ms, import 10.81s, tests 15.77s, environment 21ms)
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

1. The P117 freshness line said `1 unknown-age` without identifying what that source was. P118 clarifies that it is a candidate address source, avoiding the impression that the route-evidence or night-lighting sources have unknown age.

## Disagreements

1. None.
