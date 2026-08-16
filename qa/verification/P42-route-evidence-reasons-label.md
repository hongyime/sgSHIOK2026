# P42 Route Evidence Reasons Label

## Startup Guard

```powershell
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
6aca6a8b6e11f1a29edd223c463c5fadf0e080bf
6aca6a8b6e11f1a29edd223c463c5fadf0e080bf	refs/heads/main
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
index bf6c9c0..983d5ee 100644
--- a/.agents/STATE.md
+++ b/.agents/STATE.md
@@ -2,14 +2,15 @@
 
 Date: 2026-08-16
 
-Task: P41 browser smoke route-evidence selector is implemented and ready to hand back.
+Task: P42 route evidence reasons label is implemented and ready to hand back.
 
 Working root: `C:\sgSHIOK2026`
 Machine: `Prawn-E14`
-Remote main: `b3609b9` at P41 task start.
+Remote main: `6aca6a8` at P42 task start.
 
 Status:
 - Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
+- P42 updates the result-card reason-list accessible label from score-first wording to `Route evidence reasons`, while leaving the locked `Score breakdown` label intact. Evidence is tracked at `qa/verification/P42-route-evidence-reasons-label.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P41 updates the browser smoke script to query `Route evidence panel`, matching the P40 accessible label. Evidence is tracked at `qa/verification/P41-browser-smoke-route-selector.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P40 updates score-panel accessible region/status copy to route-evidence wording while keeping the locked score announced when present. Evidence is tracked at `qa/verification/P40-route-evidence-panel-a11y.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P39 updates the score-panel empty state from generic comfort-score copy to sheltered route-evidence copy. Evidence is tracked at `qa/verification/P39-empty-score-panel-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
diff --git a/decisions.md b/decisions.md
index 99e269b..f8abb85 100644
--- a/decisions.md
+++ b/decisions.md
@@ -116,3 +116,6 @@ The result card's accessible region and live status should name route evidence f
 
 2026-08-16 - P41 browser smoke route evidence selector:
 The browser smoke launch check must query the result card by the same accessible label the UI now exposes. Its card selector now targets `Route evidence panel` instead of the obsolete `Score panel`, with a packaging test pinning the selector. This is a QA-script compatibility change only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.
+
+2026-08-16 - P42 route evidence reasons label:
+The small reason-list chips explain the route evidence that produced or limited the selected result, while the separate breakdown section owns the locked score. The reason-list accessible label is now `Route evidence reasons` instead of `Score reasons`; `Score breakdown` remains unchanged for the locked-score section. This is a browser accessibility-copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 88f76a3..46aa11f 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1254,7 +1254,7 @@ export function ScoreCard({
         </div>
       )}
 
-      <div className={styles.reasonList} aria-label="Score reasons">
+      <div className={styles.reasonList} aria-label="Route evidence reasons">
         {reasons.map((reason) => (
           <span key={reason}>{reason}</span>
         ))}
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 4863b56..4245c2c 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -206,6 +206,8 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("142 m is the longest exposed gap.");
     expect(html).toContain("Route evidence and locked score");
     expect(html).toContain("Four display rows; weights unchanged");
+    expect(html).toContain('aria-label="Route evidence reasons"');
+    expect(html).not.toContain('aria-label="Score reasons"');
     expect(html).toContain("Shelter exposure");
     expect(html).toContain("Walk to transit");
     expect(html).toContain("Bus service support");
```

## Label Checks

```powershell
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:210:    expect(html).not.toContain('aria-label="Score reasons"');
EXIT=0
```

```powershell
C:\sgSHIOK2026\web\app\page.tsx:1257:      <div className={styles.reasonList} aria-label="Route evidence reasons">
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:209:    expect(html).toContain('aria-label="Route evidence reasons"');
EXIT=0
```

## Focused Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  13:15:49
   Duration  6.72s (transform 2.83s, setup 0ms, import 3.84s, tests 840ms, environment 2ms)

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
   Start at  13:16:29
   Duration  11.64s (transform 6.32s, setup 0ms, import 8.27s, tests 16.00s, environment 15ms)

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

1. The result-card reason chips explain route evidence and availability, but their accessible label still said `Score reasons`.
2. The label now says `Route evidence reasons`, while the separate locked-score section keeps `Score breakdown`.
3. API-dependent measurement remains gated because OneMap and LTA credential environment variables are absent.

## DISAGREEMENTS

1. None.
