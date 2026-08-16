# P40 Route Evidence Panel Accessibility

## Startup Guard

```powershell
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
6b1816d0e9abb7769722ab183886d35be30243d7
6b1816d0e9abb7769722ab183886d35be30243d7	refs/heads/main
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
index c6df482..9976d75 100644
--- a/.agents/STATE.md
+++ b/.agents/STATE.md
@@ -2,14 +2,15 @@
 
 Date: 2026-08-16
 
-Task: P39 empty score-panel route evidence copy is implemented and ready to hand back.
+Task: P40 route evidence panel accessibility copy is implemented and ready to hand back.
 
 Working root: `C:\sgSHIOK2026`
 Machine: `Prawn-E14`
-Remote main: `e5f83b5` at P39 task start.
+Remote main: `6b1816d` at P40 task start.
 
 Status:
 - Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
+- P40 updates score-panel accessible region/status copy to route-evidence wording while keeping the locked score announced when present. Evidence is tracked at `qa/verification/P40-route-evidence-panel-a11y.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P39 updates the score-panel empty state from generic comfort-score copy to sheltered route-evidence copy. Evidence is tracked at `qa/verification/P39-empty-score-panel-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P38 aligns the title-card subtitle with the settled shelter-first framing, changing the old generic `Singapore walk-to-transit comfort` copy to `Shelter-first walks to transit`. Evidence is tracked at `qa/verification/P38-shelter-first-title-card.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P37 changes the no-score detail card to say no route evidence is published for that postal in the frozen June 2020 address universe, instead of only `Not yet scored`. Evidence is tracked at `qa/verification/P37-missing-postal-score-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
diff --git a/decisions.md b/decisions.md
index 1a77d4c..1bd4a9d 100644
--- a/decisions.md
+++ b/decisions.md
@@ -110,3 +110,6 @@ The title-card subtitle should match the settled product framing that route shel
 
 2026-08-16 - P39 empty score-panel route evidence copy:
 The score panel's pre-search empty state should introduce the product as sheltered route evidence, not as a generic comfort score. The visible prompt now asks users to search a Singapore postal code to inspect sheltered walk evidence to transit. This is a browser copy change only; it does not alter search behavior, scoring, exports, inputs, public data, or locked weights.
+
+2026-08-16 - P40 route evidence panel accessibility:
+The result card's accessible region and live status should name route evidence first, matching the visible shelter-first framing. The panel is now announced as `Route evidence panel`, and its no-selection and loaded statuses use route-evidence wording while still announcing the locked composite score when a score exists. This is a browser accessibility-copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.
diff --git a/web/app/page.tsx b/web/app/page.tsx
index b490b28..88f76a3 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -143,7 +143,7 @@ export function scoreCardAnnouncement({
   previewRoute?: boolean;
   routeMode: RouteDisplayMode;
 }): string {
-  if (!selection) return "No score selected.";
+  if (!selection) return "No route evidence selected.";
   const postal = postalTitle(selection);
   if (!selection.score) return `${postal} is not in the current score bundle.`;
   const scoreText = displayScore === null || displayScore === undefined
@@ -153,8 +153,8 @@ export function scoreCardAnnouncement({
     ? previewRoute
       ? "Preview route evidence selected."
       : "Custom stop selected."
-    : "Scored route selected.";
-  return `${postal} score panel loaded. ${stationName ?? "Transit target loaded"}. Score ${scoreText}. ${stopText} Route display ${routeMode}; ${selectedRouteLabel ?? "route"} active.`;
+    : "Published route selected.";
+  return `${postal} route evidence panel loaded. ${stationName ?? "Transit target loaded"}. Score ${scoreText}. ${stopText} Route display ${routeMode}; ${selectedRouteLabel ?? "route"} active.`;
 }
 
 export function rankAnnouncement({
@@ -975,7 +975,7 @@ export function ScoreCard({
 
   if (!selection) {
     return (
-      <section className={styles.scoreCard} aria-label="Score panel">
+      <section className={styles.scoreCard} aria-label="Route evidence panel">
         <p className={styles.srOnly} role="status" aria-live="polite">
           {scoreCardAnnouncement({ selection, routeMode })}
         </p>
@@ -990,7 +990,7 @@ export function ScoreCard({
   const { score } = selection;
   if (!score) {
     return (
-      <section className={styles.scoreCard} aria-label="Score panel">
+      <section className={styles.scoreCard} aria-label="Route evidence panel">
         <p className={styles.srOnly} role="status" aria-live="polite">
           {scoreCardAnnouncement({ selection, routeMode })}
         </p>
@@ -1143,7 +1143,7 @@ export function ScoreCard({
     : [];
 
   return (
-    <section className={styles.scoreCard} aria-label="Score panel">
+    <section className={styles.scoreCard} aria-label="Route evidence panel">
       <p className={styles.srOnly} role="status" aria-live="polite">
         {scoreStatus}
       </p>
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 6f6d285..4863b56 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -140,7 +140,11 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain("Find a postal code");
+    expect(html).toContain('aria-label="Route evidence panel"');
+    expect(html).toContain("No route evidence selected.");
     expect(html).toContain("Search a Singapore postal code to inspect sheltered walk evidence to transit.");
+    expect(html).not.toContain('aria-label="Score panel"');
+    expect(html).not.toContain("No score selected.");
     expect(html).not.toContain("Search any Singapore address to see its walk-to-transit comfort score.");
   });
 
@@ -153,11 +157,14 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain('role="status"');
-    expect(html).toContain("Postal 560231 score panel loaded.");
+    expect(html).toContain("Postal 560231 route evidence panel loaded.");
     expect(html).toContain("Custom stop selected.");
     expect(html).toContain("Route display shortest");
     expect(html).toContain('aria-busy="true"');
     expect(html).toContain("Loading Overall SHIOK ranks.");
+    expect(html).toContain('aria-label="Route evidence panel"');
+    expect(html).not.toContain("Postal 560231 score panel loaded.");
+    expect(html).not.toContain('aria-label="Score panel"');
   });
 
   it("explains when a searched postal has no published route evidence", () => {
```

## Focused Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  13:06:07
   Duration  5.51s (transform 2.40s, setup 0ms, import 3.09s, tests 487ms, environment 1ms)

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
   Start at  13:06:31
   Duration  7.28s (transform 5.01s, setup 0ms, import 6.37s, tests 10.46s, environment 13ms)

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

1. The visible result card had moved to sheltered route evidence, but the accessible region and live status still named it as a score panel.
2. Screen-reader output now starts from `Route evidence panel` while still announcing the locked composite score when a score exists.
3. API-dependent measurement remains gated because OneMap and LTA credential environment variables are absent.

## DISAGREEMENTS

1. None.
