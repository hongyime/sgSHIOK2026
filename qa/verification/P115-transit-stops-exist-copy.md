# P115 Transit-Stops Exist Copy

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

The graph-disconnected no-transit state note now says `Transit stops or exits exist` instead of `Transit candidates exist`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index fff5127..54487e5 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -422,7 +422,7 @@ function scoreStateNote(score: ScoreRecord, transitMode: TransitAccessMode): str
   if (score.state === "NO_TRANSIT_IN_RANGE") {
     const reason = provenanceReason(score, transitMode);
     if (reason === "transit_candidates_graph_disconnected") {
-      return "Transit candidates exist, but this bundle has no connected walking route evidence yet.";
+      return "Transit stops or exits exist, but this bundle has no connected walking route evidence yet.";
     }
     if (reason === "no_transit_candidates_selected") {
       return "No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.";
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index eb89a18..f236e2d 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -9,7 +9,7 @@ describe("score card copy", () => {
     expect(source).toContain("Transit route not connected yet");
     expect(source).toContain("Transit stop or exit found");
     expect(source).toContain("No transit stop within scoring range");
-    expect(source).toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
+    expect(source).toContain("Transit stops or exits exist, but this bundle has no connected walking route evidence yet.");
     expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.");
     expect(source).toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
     expect(source).toContain("Current scoring range is 1.2 km");
@@ -18,6 +18,7 @@ describe("score card copy", () => {
     expect(source).toContain("Nearby transit may still exist beyond the 1.2 km scoring range");
     expect(source).not.toContain("current walking graph could not connect a route yet");
     expect(source).not.toContain("Outside current candidate thresholds");
+    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
     expect(source).not.toContain("Transit candidate found");
     expect(source).not.toContain("No transit candidate nearby");
     expect(source).not.toContain("No nearby transit candidate selected");
```

## Stale Phrase Search

```text
web/lib/__tests__/score-card-copy.test.ts:21:    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
web/lib/__tests__/score-card-copy.test.ts:22:    expect(source).not.toContain("Transit candidate found");
web/lib/__tests__/score-card-copy.test.ts:23:    expect(source).not.toContain("No transit candidate nearby");
web/lib/__tests__/score-card-copy.test.ts:24:    expect(source).not.toContain("No nearby transit candidate selected");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:09:52
   Duration  696ms (transform 75ms, setup 0ms, import 96ms, tests 31ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:10:01
   Duration  6.74s (transform 5.31s, setup 0ms, import 6.83s, tests 9.53s, environment 10ms)
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

1. The graph-disconnected no-transit state note still said `Transit candidates exist`. P115 aligns it with the P114 reason chip by saying transit stops or exits exist while connected walking-route evidence is missing.

## Disagreements

1. None.
