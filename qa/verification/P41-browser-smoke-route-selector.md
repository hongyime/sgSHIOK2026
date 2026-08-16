# P41 Browser Smoke Route Selector

## Startup Guard

```powershell
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
b3609b9397616b6ffdc53d02744dd4e51403be93
b3609b9397616b6ffdc53d02744dd4e51403be93	refs/heads/main
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
index 9976d75..bf6c9c0 100644
--- a/.agents/STATE.md
+++ b/.agents/STATE.md
@@ -2,14 +2,15 @@
 
 Date: 2026-08-16
 
-Task: P40 route evidence panel accessibility copy is implemented and ready to hand back.
+Task: P41 browser smoke route-evidence selector is implemented and ready to hand back.
 
 Working root: `C:\sgSHIOK2026`
 Machine: `Prawn-E14`
-Remote main: `6b1816d` at P40 task start.
+Remote main: `b3609b9` at P41 task start.
 
 Status:
 - Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
+- P41 updates the browser smoke script to query `Route evidence panel`, matching the P40 accessible label. Evidence is tracked at `qa/verification/P41-browser-smoke-route-selector.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P40 updates score-panel accessible region/status copy to route-evidence wording while keeping the locked score announced when present. Evidence is tracked at `qa/verification/P40-route-evidence-panel-a11y.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P39 updates the score-panel empty state from generic comfort-score copy to sheltered route-evidence copy. Evidence is tracked at `qa/verification/P39-empty-score-panel-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P38 aligns the title-card subtitle with the settled shelter-first framing, changing the old generic `Singapore walk-to-transit comfort` copy to `Shelter-first walks to transit`. Evidence is tracked at `qa/verification/P38-shelter-first-title-card.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
diff --git a/decisions.md b/decisions.md
index 1bd4a9d..99e269b 100644
--- a/decisions.md
+++ b/decisions.md
@@ -113,3 +113,6 @@ The score panel's pre-search empty state should introduce the product as shelter
 
 2026-08-16 - P40 route evidence panel accessibility:
 The result card's accessible region and live status should name route evidence first, matching the visible shelter-first framing. The panel is now announced as `Route evidence panel`, and its no-selection and loaded statuses use route-evidence wording while still announcing the locked composite score when a score exists. This is a browser accessibility-copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.
+
+2026-08-16 - P41 browser smoke route evidence selector:
+The browser smoke launch check must query the result card by the same accessible label the UI now exposes. Its card selector now targets `Route evidence panel` instead of the obsolete `Score panel`, with a packaging test pinning the selector. This is a QA-script compatibility change only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index 06e63e8..1d2335c 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -59,6 +59,8 @@ describe("deployment packaging", () => {
     expect(script).toContain("score_has_max_denominator");
     expect(script).toContain("map_has_text_equivalent");
     expect(script).toContain("short_mobile_card_bottom_visible");
+    expect(script).toContain('section[aria-label="Route evidence panel"]');
+    expect(script).not.toContain('section[aria-label="Score panel"]');
   });
 
   it("keeps data-bundle release dry-run safe by default", () => {
diff --git a/web/scripts/browser-smoke.mjs b/web/scripts/browser-smoke.mjs
index 9b27169..5f296b8 100644
--- a/web/scripts/browser-smoke.mjs
+++ b/web/scripts/browser-smoke.mjs
@@ -522,7 +522,7 @@ async function collectPageSummary(cdp) {
   const result = await cdp.send("Runtime.evaluate", {
     returnByValue: true,
     expression: `(() => {
-      const card = document.querySelector('section[aria-label="Score panel"]');
+      const card = document.querySelector('section[aria-label="Route evidence panel"]');
       const map = document.querySelector('[aria-describedby="route-map-summary"]');
       const summary = document.querySelector('#route-map-summary');
       const details = document.querySelector('details');
```

## Selector Checks

```powershell
EXIT=1
```

```powershell
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:62:    expect(script).toContain('section[aria-label="Route evidence panel"]');
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:525:      const card = document.querySelector('section[aria-label="Route evidence panel"]');
EXIT=0
```

## Focused Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  13:11:05
   Duration  4.66s (transform 738ms, setup 0ms, import 871ms, tests 240ms, environment 2ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/deployment.test.ts
```

## TypeScript

```powershell
```

## Full Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  119 passed (119)
   Start at  13:11:35
   Duration  8.77s (transform 6.29s, setup 0ms, import 7.68s, tests 11.97s, environment 22ms)

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

No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, browser smoke run, or `pipeline/config/weights.yaml` change was run.

## FINDINGS

1. P40 changed the result card's accessible label to `Route evidence panel`, but `web/scripts/browser-smoke.mjs` still queried the old `Score panel` selector, so a launch smoke run would not collect the result-card text.
2. The smoke script now uses the route-evidence selector, and `deployment.test.ts` pins both the presence of the new selector and absence of the old selector in the script.
3. API-dependent measurement remains gated because OneMap and LTA credential environment variables are absent.

## DISAGREEMENTS

1. None.
