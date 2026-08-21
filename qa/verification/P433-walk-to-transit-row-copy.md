# P433 Walk To Transit Row Copy

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

The `Walk to transit` display row still said `Selected walk distance to transit.` even though it renders the active displayed walk distance. This lagged behind the hero, exposed-gap heading, gap summary, and live-region copy.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 6fdfe02..efedf37 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1257,6 +1257,13 @@ export function ScoreCard({
       : routeMode === "shortest" && !sameRoute
         ? "shortest walk"
         : "sheltered walk";
+  const selectedWalkSentenceLabel = previewRoute
+    ? "OneMap preview walk"
+    : directBusFallback
+      ? "Direct bus line estimate"
+      : routeMode === "shortest" && !sameRoute
+        ? "Shortest walk"
+        : "Sheltered walk";
   const longestGapText = longestGap
     ? `${formatDistance(longestGap.len_m)} is the longest exposed gap.`
     : `No exposed gaps are recorded for this ${selectedWalkLabel}.`;
@@ -1316,7 +1323,7 @@ export function ScoreCard({
           label: "Walk to transit",
           value: score.paths ? formatDistance(selectedDistance) : formatScore(score.subscores.access),
           meta: scoredMeta(score.subscores.access, "35% locked access", "Access term unavailable"),
-          notes: [`Selected walk distance to ${transitModeLabel(transitMode)}.`],
+          notes: [`${selectedWalkSentenceLabel} distance to ${transitModeLabel(transitMode)}.`],
         },
         {
           id: "bus",
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 3001f29..5e7d4d5 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -461,7 +461,8 @@ describe("rendered accessibility output", () => {
     expect(html).not.toContain('aria-label="Score reasons"');
     expect(html).toContain("Shelter exposure");
     expect(html).toContain("Walk to transit");
-    expect(html).toContain("Selected walk distance to transit.");
+    expect(html).toContain("Sheltered walk distance to transit.");
+    expect(html).not.toContain("Selected walk distance to transit.");
     expect(html).not.toContain("Selected route distance to transit.");
     expect(html).toContain("Bus service support");
     expect(html).toContain("Locked SHIOK score");
@@ -618,6 +619,8 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("48% covered-walkway ratio on the shortest walk.");
     expect(html).toContain("181 m exposed across 2 gaps on the shortest walk.");
+    expect(html).toContain("Shortest walk distance to transit.");
+    expect(html).not.toContain("Sheltered walk distance to transit.");
     expect(html).toContain(
       "Shelter evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
     );
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  20:54:22
   Duration  2.73s (transform 1.32s, setup 0ms, import 1.70s, tests 535ms, environment 1ms)
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

`git check-ignore -v qa/verification/P433-walk-to-transit-row-copy.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The `Walk to transit` row still used generic `Selected walk distance` copy after the rest of the score card had been aligned to the active displayed walk.

## DISAGREEMENTS

1. None.
