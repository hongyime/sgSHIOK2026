# P39 Empty Score-Panel Copy

## Startup Guard

```powershell
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
e5f83b53d401ea39c5dbf3490a864744085446b3
e5f83b53d401ea39c5dbf3490a864744085446b3	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Credential Gate

```powershell
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## Evidence Path

```powershell
EXIT=1
```

## Final Diff

```diff
diff --git a/.agents/STATE.md b/.agents/STATE.md
index 7ceb7df..c6df482 100644
--- a/.agents/STATE.md
+++ b/.agents/STATE.md
@@ -2,14 +2,15 @@
 
 Date: 2026-08-16
 
-Task: P38 shelter-first title-card copy is implemented and ready to hand back.
+Task: P39 empty score-panel route evidence copy is implemented and ready to hand back.
 
 Working root: `C:\sgSHIOK2026`
 Machine: `Prawn-E14`
-Remote main: `9925976` at P38 task start.
+Remote main: `e5f83b5` at P39 task start.
 
 Status:
 - Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
+- P39 updates the score-panel empty state from generic comfort-score copy to sheltered route-evidence copy. Evidence is tracked at `qa/verification/P39-empty-score-panel-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P38 aligns the title-card subtitle with the settled shelter-first framing, changing the old generic `Singapore walk-to-transit comfort` copy to `Shelter-first walks to transit`. Evidence is tracked at `qa/verification/P38-shelter-first-title-card.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P37 changes the no-score detail card to say no route evidence is published for that postal in the frozen June 2020 address universe, instead of only `Not yet scored`. Evidence is tracked at `qa/verification/P37-missing-postal-score-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P36 clarifies the title-card freshness copy: route evidence has the bundle date, while the address universe is frozen v1 from a June 2020 OneMap-derived postal scrape. Evidence is tracked at `qa/verification/P36-frozen-universe-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
diff --git a/decisions.md b/decisions.md
index f28de9f..1a77d4c 100644
--- a/decisions.md
+++ b/decisions.md
@@ -107,3 +107,6 @@ When a searched postal has no score record, the detail card should explain that
 
 2026-08-16 - P38 shelter-first title card:
 The title-card subtitle should match the settled product framing that route shelter evidence leads and the locked composite is secondary. The visible subtitle is now `Shelter-first walks to transit` instead of the older generic `Singapore walk-to-transit comfort`. This is a browser copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.
+
+2026-08-16 - P39 empty score-panel route evidence copy:
+The score panel's pre-search empty state should introduce the product as sheltered route evidence, not as a generic comfort score. The visible prompt now asks users to search a Singapore postal code to inspect sheltered walk evidence to transit. This is a browser copy change only; it does not alter search behavior, scoring, exports, inputs, public data, or locked weights.
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 5138f94..b490b28 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -981,7 +981,7 @@ export function ScoreCard({
         </p>
         <div className={styles.emptyState}>
           <strong>Find a postal code</strong>
-          <span>Search any Singapore address to see its walk-to-transit comfort score.</span>
+          <span>Search a Singapore postal code to inspect sheltered walk evidence to transit.</span>
         </div>
       </section>
     );
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 61aeb91..6f6d285 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -133,6 +133,17 @@ describe("rendered accessibility output", () => {
     expect(errorHtml).toContain("Failed to search postal location.");
   });
 
+  it("introduces the score panel as sheltered route evidence before search", () => {
+    const html = renderScoreCard({
+      selection: null,
+      rankingRecords: [],
+    });
+
+    expect(html).toContain("Find a postal code");
+    expect(html).toContain("Search a Singapore postal code to inspect sheltered walk evidence to transit.");
+    expect(html).not.toContain("Search any Singapore address to see its walk-to-transit comfort score.");
+  });
+
   it("renders live status for score card load, route mode, stop selection, and ranks", () => {
     const html = renderScoreCard({
       routeMode: "shortest",
```

## Focused Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  13:00:27
   Duration  7.25s (transform 3.18s, setup 0ms, import 4.00s, tests 651ms, environment 2ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx
```

## TypeScript

```powershell
```

## Full Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  119 passed (119)
   Start at  13:00:57
   Duration  11.72s (transform 7.41s, setup 0ms, import 8.72s, tests 16.19s, environment 13ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

## Repository Integrity

```powershell
repo_integrity=ok
EXIT=0
```

## Weights Diff

```powershell
EXIT=0
```

## Scope

No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or `pipeline/config/weights.yaml` change was run.

## FINDINGS

1. The credential gate remains closed: `ONEMAP_EMAIL`, `ONEMAP_PASSWORD`, and `LTA_DATAMALL_ACCOUNT_KEY` are absent, so API-dependent measurement remains blocked by environment rather than project code.
2. The pre-search score panel still introduced the product as a generic `walk-to-transit comfort score`; this conflicted with the settled shelter-first route-evidence framing.
3. The web test count increased from 118 to 119 because this change adds one render test for the empty score-panel copy.

## DISAGREEMENTS

1. None.
