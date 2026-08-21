# P430 Sheltered Walk Reason Copy

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

No scoring, export, rescore, subset run, ingest, network build, deploy, or public data write was run.

## Scope

Free-tier browser copy change only:

- `web/app/page.tsx`
- `web/lib/__tests__/accessibility-render.test.tsx`

The reason chips still said `covered-walkway ratio on selected walk`, while that helper reports the published sheltered path. The no-gap exposure fallback also still had the generic `selected walk` wording.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 1335126..4cbadb9 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -783,7 +783,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
     measuredReasons.push(`${formatDistance(score.paths.sheltered_m)} to ${transitModeLabel(transitMode)}`);
   }
   if (typeof score.paths.covered_ratio === "number") {
-    measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on selected walk`);
+    measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on sheltered walk`);
   }
   if (busFallback) {
     measuredReasons.push("Nearby bus service not walk-verified");
@@ -1249,22 +1249,22 @@ export function ScoreCard({
   const totalExposureM = exposureGaps.reduce((total, gap) => total + gap.len_m, 0);
   const gapsWithCoordinates = exposureGaps.filter((gap) => formatGapLocation(gap)).length;
   const hiddenGapCount = Math.max(0, exposureGaps.length - visibleExposureGaps.length);
+  const selectedWalkLabel = previewRoute
+    ? "OneMap preview walk"
+    : directBusFallback
+      ? "direct bus line estimate"
+      : routeMode === "shortest" && !sameRoute
+        ? "shortest walk"
+        : "sheltered walk";
   const longestGapText = longestGap
     ? `${formatDistance(longestGap.len_m)} is the longest exposed gap.`
-    : "No exposed gaps are recorded for this selected walk.";
+    : `No exposed gaps are recorded for this ${selectedWalkLabel}.`;
   const exposureHeroText =
     exposureGaps.length === 0
       ? longestGapText
       : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
           exposureGaps.length === 1 ? "" : "s"
         }; ${longestGapText}`;
-  const selectedWalkLabel = previewRoute
-    ? "OneMap preview walk"
-    : directBusFallback
-      ? "direct bus line estimate"
-      : routeMode === "shortest" && !sameRoute
-        ? "shortest walk"
-        : "sheltered walk";
   const gapSummaryText =
     exposureGaps.length === 0
       ? null
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index c317c03..602e4cd 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -620,6 +620,24 @@ describe("rendered accessibility output", () => {
     expect(html).not.toContain("exposed across 2 gaps on the selected walk.");
   });
 
+  it("names the displayed walk in the no-gap exposure fallback", () => {
+    const recordWithoutGaps: ScoreRecord = {
+      ...scoredRecord,
+      exposure_gaps: [],
+    };
+    const html = renderScoreCard({
+      routeMode: "shortest",
+      selection: {
+        ...selection,
+        score: recordWithoutGaps,
+      },
+      rankingRecords: [recordWithoutGaps],
+    });
+
+    expect(html).toContain("No exposed gaps are recorded for this shortest walk.");
+    expect(html).not.toContain("No exposed gaps are recorded for this selected walk.");
+  });
+
   it("labels transit target availability before a user switches modes", () => {
     const recordWithRouteOptions: ScoreRecord = {
       ...scoredRecord,
@@ -776,7 +794,8 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain("Nearby bus service not walk-verified");
-    expect(html).toContain("62% covered-walkway ratio on selected walk");
+    expect(html).toContain("62% covered-walkway ratio on sheltered walk");
+    expect(html).not.toContain("62% covered-walkway ratio on selected walk");
     expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
     expect(html).not.toContain("direct bus candidates found");
     expect(html).not.toContain("Direct line to bus stop; walking route pending.");
@@ -882,7 +901,8 @@ describe("rendered accessibility output", () => {
     expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
 
     expect(flaggedNoBusHtml).toContain("Nearby bus service not walk-verified");
-    expect(flaggedNoBusHtml).toContain("62% covered-walkway ratio on selected walk");
+    expect(flaggedNoBusHtml).toContain("62% covered-walkway ratio on sheltered walk");
+    expect(flaggedNoBusHtml).not.toContain("62% covered-walkway ratio on selected walk");
     expect(unflaggedNoBusHtml).toContain("Limited bus-service evidence");
     expect(unflaggedNoBusHtml).not.toContain("Limited bus connectivity");
     expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  25 passed (25)
   Start at  20:40:12
   Duration  1.15s (transform 477ms, setup 0ms, import 638ms, tests 205ms, environment 0ms)
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

Protected diff guard output above is empty except for `EXIT=0`.

```text
EXIT=1
```

`git check-ignore -v qa/verification/P430-sheltered-walk-reason-copy.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. Reason chips still described the covered-walkway ratio as being on a generic `selected walk`, even though that helper reports the published sheltered path.
2. The no-exposed-gaps fallback also retained generic `selected walk` wording after the displayed-walk label was available.

## DISAGREEMENTS

1. None.
