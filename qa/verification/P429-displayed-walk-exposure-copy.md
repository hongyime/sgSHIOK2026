# P429 Displayed Walk Exposure Copy

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

The exposure hero and exposed-gap summary used the generic phrase `selected walk` even though the score card already knows whether the displayed line is the sheltered walk, shortest walk, OneMap preview walk, or direct bus line estimate.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 8a32577..1335126 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1258,12 +1258,19 @@ export function ScoreCard({
       : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
           exposureGaps.length === 1 ? "" : "s"
         }; ${longestGapText}`;
+  const selectedWalkLabel = previewRoute
+    ? "OneMap preview walk"
+    : directBusFallback
+      ? "direct bus line estimate"
+      : routeMode === "shortest" && !sameRoute
+        ? "shortest walk"
+        : "sheltered walk";
   const gapSummaryText =
     exposureGaps.length === 0
       ? null
       : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
           exposureGaps.length === 1 ? "" : "s"
-        } on the selected walk.`;
+        } on the ${selectedWalkLabel}.`;
   const gapListScopeText =
     hiddenGapCount > 0
       ? `Showing the longest ${visibleExposureGaps.length}; ${hiddenGapCount} shorter gap${
@@ -1276,7 +1283,6 @@ export function ScoreCard({
           exposureGaps.length === 1 ? "" : "s"
         } include map coordinates.`
       : "No map coordinates are recorded for these exposed gaps.";
-  const selectedWalkLabel = previewRoute ? "preview walk" : "selected walk";
   const evidenceRows: EvidenceBreakdownRow[] = score.subscores
     ? [
         {
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index eddbf38..c317c03 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -427,7 +427,8 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Where the walk is exposed");
     expect(html).toContain('aria-label="Walk shelter evidence"');
-    expect(html).toContain("62% covered-walkway ratio on the selected walk.");
+    expect(html).toContain("62% covered-walkway ratio on the sheltered walk.");
+    expect(html).not.toContain("62% covered-walkway ratio on the selected walk.");
     expect(html).not.toContain("62% of the selected walk is covered.");
     expect(html).toContain("181 m exposed across 2 gaps; 142 m is the longest exposed gap.");
     expect(html).toContain("142 m is the longest exposed gap.");
@@ -598,7 +599,8 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Exposed gaps on this walk");
     expect(html).toContain("142 m");
-    expect(html).toContain("181 m exposed across 2 gaps on the selected walk.");
+    expect(html).toContain("181 m exposed across 2 gaps on the sheltered walk.");
+    expect(html).not.toContain("181 m exposed across 2 gaps on the selected walk.");
     expect(html).toContain("All recorded exposed gaps are shown.");
     expect(html).toContain("2 of 2 exposed gaps include map coordinates.");
     expect(html).toContain("Longest open-air stretch");
@@ -607,6 +609,17 @@ describe("rendered accessibility output", () => {
     expect(html).toContain('aria-label="Focus map on Longest open-air stretch near 1.37123, 103.84235"');
   });
 
+  it("names the shortest walk in exposure copy when that display is active", () => {
+    const html = renderScoreCard({
+      routeMode: "shortest",
+    });
+
+    expect(html).toContain("48% covered-walkway ratio on the shortest walk.");
+    expect(html).toContain("181 m exposed across 2 gaps on the shortest walk.");
+    expect(html).not.toContain("covered-walkway ratio on the selected walk.");
+    expect(html).not.toContain("exposed across 2 gaps on the selected walk.");
+  });
+
   it("labels transit target availability before a user switches modes", () => {
     const recordWithRouteOptions: ScoreRecord = {
       ...scoredRecord,
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  24 passed (24)
   Start at  20:34:34
   Duration  3.32s (transform 1.25s, setup 0ms, import 1.64s, tests 688ms, environment 1ms)
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

`git check-ignore -v qa/verification/P429-displayed-walk-exposure-copy.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. Exposure copy still said `selected walk` even when the active display was specifically the sheltered walk or shortest walk, making the main evidence less concrete than the UI state allowed.

## DISAGREEMENTS

1. None.
