# P111 No-Transit Stop Range Copy

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

The no-transit candidate-selection state now uses transit-stop/range language instead of exposing candidate-selection implementation terms.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 190b916..2469cbc 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -406,7 +406,7 @@ function nearestRoutedTransitM(score: ScoreRecord, transitMode: TransitAccessMod
 function noTransitTitle(score: ScoreRecord, transitMode: TransitAccessMode): string {
   const reason = provenanceReason(score, transitMode);
   if (reason === "transit_candidates_graph_disconnected") return "Transit route not connected yet";
-  if (reason === "no_transit_candidates_selected") return "No transit candidate nearby";
+  if (reason === "no_transit_candidates_selected") return "No transit stop within scoring range";
   return nearestRoutedTransitM(score, transitMode) !== null
     ? "Transit beyond scoring range"
     : `No routed ${transitModeLabel(transitMode)} within range`;
@@ -425,7 +425,7 @@ function scoreStateNote(score: ScoreRecord, transitMode: TransitAccessMode): str
       return "Transit candidates exist, but this bundle has no connected walking route evidence yet.";
     }
     if (reason === "no_transit_candidates_selected") {
-      return "No qualifying MRT/LRT exit or bus stop candidate was selected near this postal.";
+      return "No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.";
     }
     const nearestM = nearestRoutedTransitM(score, transitMode);
     if (nearestM !== null) {
@@ -677,7 +677,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
       return ["Transit candidate found", "Walking route not connected yet"];
     }
     if (reason === "no_transit_candidates_selected") {
-      return ["No nearby transit candidate selected", "Outside current transit-candidate limits"];
+      return ["No transit stop within scoring range", "Outside current 1.2 km scoring range"];
     }
     const nearestM = nearestRoutedTransitM(score, transitMode);
     return nearestM !== null
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index eb07b3b..05772b3 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -7,15 +7,19 @@ describe("score card copy", () => {
 
     expect(source).toContain("Transit beyond scoring range");
     expect(source).toContain("Transit route not connected yet");
-    expect(source).toContain("No transit candidate nearby");
+    expect(source).toContain("No transit stop within scoring range");
     expect(source).toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
+    expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.");
     expect(source).toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
     expect(source).toContain("Current scoring range is 1.2 km");
     expect(source).toContain("Walking route not connected yet");
-    expect(source).toContain("Outside current transit-candidate limits");
+    expect(source).toContain("Outside current 1.2 km scoring range");
     expect(source).toContain("Nearby transit may still exist beyond the 1.2 km scoring range");
     expect(source).not.toContain("current walking graph could not connect a route yet");
     expect(source).not.toContain("Outside current candidate thresholds");
+    expect(source).not.toContain("No transit candidate nearby");
+    expect(source).not.toContain("No nearby transit candidate selected");
+    expect(source).not.toContain("Outside current transit-candidate limits");
     expect(source).not.toContain("Nearby transit may still exist outside the current threshold");
   });
```

## Stale Phrase Search

```text
web/lib/__tests__/score-card-copy.test.ts:20:    expect(source).not.toContain("No transit candidate nearby");
web/lib/__tests__/score-card-copy.test.ts:21:    expect(source).not.toContain("No nearby transit candidate selected");
web/lib/__tests__/score-card-copy.test.ts:22:    expect(source).not.toContain("Outside current transit-candidate limits");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:55:43
   Duration  1.42s (transform 270ms, setup 0ms, import 311ms, tests 197ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:56:14
   Duration  22.33s (transform 15.89s, setup 0ms, import 20.08s, tests 27.79s, environment 52ms)
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

1. The no-transit candidate-selection state still exposed `candidate` in user-facing copy after P105. P111 replaces that with transit-stop and 1.2 km scoring-range language while leaving graph-disconnected records as a separate route-evidence state.

## Disagreements

1. None.
