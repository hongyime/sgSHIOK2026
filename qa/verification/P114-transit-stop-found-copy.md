# P114 Transit-Stop Found Copy

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

The graph-disconnected no-transit reason chip now says `Transit stop or exit found` instead of `Transit candidate found`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 1ab0001..fff5127 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -674,7 +674,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
     const label = transitModeLabel(transitMode);
     const reason = provenanceReason(score, transitMode);
     if (reason === "transit_candidates_graph_disconnected") {
-      return ["Transit candidate found", "Walking route not connected yet"];
+      return ["Transit stop or exit found", "Walking route not connected yet"];
     }
     if (reason === "no_transit_candidates_selected") {
       return ["No transit stop within scoring range", "Outside current 1.2 km scoring range"];
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 05772b3..eb89a18 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -7,6 +7,7 @@ describe("score card copy", () => {
 
     expect(source).toContain("Transit beyond scoring range");
     expect(source).toContain("Transit route not connected yet");
+    expect(source).toContain("Transit stop or exit found");
     expect(source).toContain("No transit stop within scoring range");
     expect(source).toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
     expect(source).toContain("No qualifying MRT/LRT exit or bus stop was found within the 1.2 km scoring range for this postal.");
@@ -17,6 +18,7 @@ describe("score card copy", () => {
     expect(source).toContain("Nearby transit may still exist beyond the 1.2 km scoring range");
     expect(source).not.toContain("current walking graph could not connect a route yet");
     expect(source).not.toContain("Outside current candidate thresholds");
+    expect(source).not.toContain("Transit candidate found");
     expect(source).not.toContain("No transit candidate nearby");
     expect(source).not.toContain("No nearby transit candidate selected");
     expect(source).not.toContain("Outside current transit-candidate limits");
```

## Stale Phrase Search

```text
web/lib/__tests__/score-card-copy.test.ts:21:    expect(source).not.toContain("Transit candidate found");
web/lib/__tests__/score-card-copy.test.ts:22:    expect(source).not.toContain("No transit candidate nearby");
web/lib/__tests__/score-card-copy.test.ts:23:    expect(source).not.toContain("No nearby transit candidate selected");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:06:44
   Duration  809ms (transform 109ms, setup 0ms, import 139ms, tests 46ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:06:55
   Duration  6.86s (transform 5.06s, setup 0ms, import 6.13s, tests 10.52s, environment 9ms)
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

1. The graph-disconnected no-transit reason chip still said `Transit candidate found`. P114 changes the rendered chip to `Transit stop or exit found` while preserving the unresolved walking-route connection message.

## Disagreements

1. None.
