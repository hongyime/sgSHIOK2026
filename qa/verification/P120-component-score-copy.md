# P120 Component-Score Copy

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

Rendered score-card copy now uses `component score` instead of `sub-score` in partial-score notes, bus fallback notes, and planning-area rank view text.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 4c8f6f1..2765ee6 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -426,7 +426,7 @@ function scoreStateNote(score: ScoreRecord, transitMode: TransitAccessMode): str
     return "Preview only: this clicked stop has route evidence, but it is not an authoritative SHIOK score until it is included in a published score bundle.";
   }
   if (score.state === "SCORED_PARTIAL") {
-    return "Partial bundle score: one or more sub-scores are unavailable; locked weights count missing terms as zero.";
+    return "Partial bundle score: one or more component scores are unavailable; locked weights count missing terms as zero.";
   }
   if (score.state === "NO_TRANSIT_IN_RANGE") {
     const reason = provenanceReason(score, transitMode);
@@ -1195,7 +1195,7 @@ export function ScoreCard({
           notes: [
             "A low value can mean weak service evidence, or that routing could not prove a trusted walk to a DataMall bus stop.",
             busFallback
-              ? `${busFallbackSummary(busFallback)} Walking-route access was not verified, so this sub-score remains 0.`
+              ? `${busFallbackSummary(busFallback)} Walking-route access was not verified, so this component score remains 0.`
               : null,
           ].filter((note): note is string => Boolean(note)),
         },
@@ -1368,7 +1368,7 @@ export function ScoreCard({
                   ? "Loads planning-area ranks only when opened."
                   : rankMetric === "overall"
                   ? "Planning-area order by locked score."
-                  : "Planning-area sub-score view; locked SHIOK score is unchanged."}
+                  : "Planning-area component-score view; locked SHIOK score is unchanged."}
               </span>
             </div>
             {rankPanelOpen ? (
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index b3478f0..c54a333 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -355,8 +355,9 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Shelter exposure");
     expect(html).toContain(
-      "Partial bundle score: one or more sub-scores are unavailable; locked weights count missing terms as zero."
+      "Partial bundle score: one or more component scores are unavailable; locked weights count missing terms as zero."
     );
+    expect(html).not.toContain("one or more sub-scores are unavailable");
     expect(html).toContain("Route evidence unavailable");
     expect(html).toContain("Bundle score unavailable");
     expect(html).toContain("<strong>Not scored</strong><small>No shelter score</small>");
@@ -431,7 +432,8 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("62% sheltered on sheltered route");
     expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
     expect(html).not.toContain("direct bus candidates found");
-    expect(html).toContain("Walking-route access was not verified, so this sub-score remains 0.");
+    expect(html).toContain("Walking-route access was not verified, so this component score remains 0.");
+    expect(html).not.toContain("so this sub-score remains 0");
     expect(html).not.toContain("Walking network access was not verified");
     expect(html).toContain("Locked score caveat: the bus term remains 0");
     expect(html).toContain("Bus service support");
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 8a3a622..febce61 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -168,7 +168,9 @@ describe("score card copy", () => {
     expect(source).not.toContain('label: "Overall SHIOK"');
     expect(source).not.toContain("Use this locked composite");
     expect(source).toContain("Planning-area order by locked score.");
+    expect(source).toContain("Planning-area component-score view; locked SHIOK score is unchanged.");
     expect(source).not.toContain("Authoritative composite order.");
+    expect(source).not.toContain("Planning-area sub-score view; locked SHIOK score is unchanged.");
     expect(source).toContain("Four display rows; weights unchanged");
     expect(source).toContain('"No locked score"');
     expect(source).toContain('label: "Shelter exposure"');
```

## Stale Phrase Search

```text
web/lib/__tests__/accessibility-render.test.tsx:360:    expect(html).not.toContain("one or more sub-scores are unavailable");
web/lib/__tests__/accessibility-render.test.tsx:436:    expect(html).not.toContain("so this sub-score remains 0");
web/lib/__tests__/score-card-copy.test.ts:173:    expect(source).not.toContain("Planning-area sub-score view; locked SHIOK score is unchanged.");
```

## Focused Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  25 passed (25)
   Start at  21:28:08
   Duration  2.88s (transform 1.33s, setup 0ms, import 1.91s, tests 472ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:28:22
   Duration  7.88s (transform 5.31s, setup 0ms, import 6.84s, tests 11.17s, environment 17ms)
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

1. The rendered score card still used `sub-score` in partial-score, bus-fallback, and planning-area rank text. P120 replaces those with component-score wording.

## Disagreements

1. None.
