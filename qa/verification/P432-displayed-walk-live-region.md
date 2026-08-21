# P432 Displayed Walk Live Region

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

Free-tier browser accessibility fix only:

- `web/app/page.tsx`
- `web/lib/__tests__/accessibility-render.test.tsx`
- `web/lib/__tests__/score-card-copy.test.ts`

The visible shortest-walk hero could show `48% covered-walkway ratio on the shortest walk`, while the score-card live region still announced `62% covered-walkway ratio`, because `scoreCardAnnouncement()` formatted shelter evidence directly from the base score record.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 23341e7..6fdfe02 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -176,24 +176,33 @@ export function routeDisplayAnnouncement(mode: RouteDisplayMode, sameRoute: bool
   return "sheltered walk";
 }
 
-function shelterEvidenceAnnouncement(score: ScoreRecord): string {
+function shelterEvidenceAnnouncementFromValues(
+  coveredRatio: number | null | undefined,
+  gaps: ExposureGap[] | null | undefined
+): string {
   const parts: string[] = [];
-  if (typeof score.paths?.covered_ratio === "number") {
-    parts.push(`${formatPercent(Math.round(score.paths.covered_ratio * 100))} covered-walkway ratio`);
+  if (typeof coveredRatio === "number") {
+    parts.push(`${formatPercent(coveredRatio)} covered-walkway ratio`);
   }
-  if (score.exposure_gaps) {
-    const sortedGaps = [...score.exposure_gaps].sort((a, b) => b.len_m - a.len_m);
+  if (gaps && gaps.length > 0) {
+    const sortedGaps = [...gaps].sort((a, b) => b.len_m - a.len_m);
     const totalExposureM = sortedGaps.reduce((total, gap) => total + gap.len_m, 0);
     const longestGap = sortedGaps[0];
     parts.push(
-      `${formatDistance(totalExposureM)} exposed across ${score.exposure_gaps.length} gap${
-        score.exposure_gaps.length === 1 ? "" : "s"
+      `${formatDistance(totalExposureM)} exposed across ${gaps.length} gap${
+        gaps.length === 1 ? "" : "s"
       }${longestGap ? `; longest gap ${formatDistance(longestGap.len_m)}` : ""}`
     );
   }
   return parts.length > 0 ? `Shelter evidence ${parts.join("; ")}.` : "Shelter evidence unavailable.";
 }
 
+function shelterEvidenceAnnouncement(score: ScoreRecord): string {
+  const coveredRatio =
+    typeof score.paths?.covered_ratio === "number" ? Math.round(score.paths.covered_ratio * 100) : null;
+  return shelterEvidenceAnnouncementFromValues(coveredRatio, score.exposure_gaps);
+}
+
 export function scoreCardAnnouncement({
   selection,
   stationName,
@@ -203,6 +212,7 @@ export function scoreCardAnnouncement({
   previewRoute,
   routeMode,
   routeDisplayLabel,
+  shelterEvidenceText,
 }: {
   selection: LoadedSelection | null;
   stationName?: string;
@@ -212,6 +222,7 @@ export function scoreCardAnnouncement({
   previewRoute?: boolean;
   routeMode: RouteDisplayMode;
   routeDisplayLabel?: string;
+  shelterEvidenceText?: string;
 }): string {
   if (!selection) return "No shelter map walk selected.";
   const postal = postalTitle(selection);
@@ -226,7 +237,7 @@ export function scoreCardAnnouncement({
       ? "Preview shelter map evidence selected."
       : "Custom transit stop selected."
     : "Published walk selected.";
-  const shelterText = shelterEvidenceAnnouncement(selection.score);
+  const shelterText = shelterEvidenceText ?? shelterEvidenceAnnouncement(selection.score);
   return `${postal} shelter map panel loaded. ${stationName ?? "Transit target loaded"}. ${shelterText} Locked score ${scoreText}. ${stopText} Walk display ${routeDisplayLabel ?? routeMode}; ${selectedRouteLabel ?? "walk"} active.`;
 }
 
@@ -1179,16 +1190,6 @@ export function ScoreCard({
   );
   const rankMetricLabel =
     RANK_METRIC_OPTIONS.find((option) => option.id === rankMetric)?.label ?? "Locked SHIOK score";
-  const scoreStatus = scoreCardAnnouncement({
-    selection,
-    stationName,
-    selectedRouteLabel,
-    displayScore,
-    isCustomStopSelected,
-    previewRoute,
-    routeMode,
-    routeDisplayLabel: routeDisplayAnnouncement(routeMode, sameRoute),
-  });
   const rankStatus = rankAnnouncement({
     loading: rankingLoading,
     rankedCount: rankedRecords.length,
@@ -1265,6 +1266,17 @@ export function ScoreCard({
       : `${formatDistance(totalExposureM)} exposed across ${exposureGaps.length} gap${
           exposureGaps.length === 1 ? "" : "s"
         }; ${longestGapText}`;
+  const scoreStatus = scoreCardAnnouncement({
+    selection,
+    stationName,
+    selectedRouteLabel,
+    displayScore,
+    isCustomStopSelected,
+    previewRoute,
+    routeMode,
+    routeDisplayLabel: routeDisplayAnnouncement(routeMode, sameRoute),
+    shelterEvidenceText: shelterEvidenceAnnouncementFromValues(selectedCoverage, exposureGaps),
+  });
   const gapSummaryText =
     exposureGaps.length === 0
       ? null
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 5a7af3e..3001f29 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -213,9 +213,10 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain('role="status"');
     expect(html).toContain("Postal 560231 shelter map panel loaded.");
-    expect(html).toContain("Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
+    expect(html).toContain("Shelter evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
+    expect(html).not.toContain("Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
     expect(html).toContain("Locked score 72 out of 100.");
-    expect(html.indexOf("Shelter evidence 62% covered-walkway ratio")).toBeLessThan(
+    expect(html.indexOf("Shelter evidence 48% covered-walkway ratio")).toBeLessThan(
       html.indexOf("Locked score 72 out of 100.")
     );
     expect(html).toContain("<span>Locked score</span><strong>72/100</strong>");
@@ -617,6 +618,12 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("48% covered-walkway ratio on the shortest walk.");
     expect(html).toContain("181 m exposed across 2 gaps on the shortest walk.");
+    expect(html).toContain(
+      "Shelter evidence 48% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
+    );
+    expect(html).not.toContain(
+      "Shelter evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m."
+    );
     expect(html).not.toContain("covered-walkway ratio on the selected walk.");
     expect(html).not.toContain("exposed across 2 gaps on the selected walk.");
   });
@@ -636,6 +643,8 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain("No exposed gaps are recorded for this shortest walk.");
+    expect(html).toContain("Shelter evidence 48% covered-walkway ratio.");
+    expect(html).not.toContain("0 m exposed across 0 gaps");
     expect(html).not.toContain("No exposed gaps are recorded for this selected walk.");
     expect(html).not.toContain("Exposed gaps on this walk");
   });
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index bac57c3..30baff0 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -305,7 +305,9 @@ describe("score card copy", () => {
     const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
 
     expect(source).toContain("buildRouteCompareNote");
-    expect(source).toContain("const sortedGaps = [...score.exposure_gaps].sort((a, b) => b.len_m - a.len_m);");
+    expect(source).toContain("function shelterEvidenceAnnouncementFromValues");
+    expect(source).toContain("const sortedGaps = [...gaps].sort((a, b) => b.len_m - a.len_m);");
+    expect(source).toContain("shelterEvidenceText: shelterEvidenceAnnouncementFromValues(selectedCoverage, exposureGaps)");
     expect(source).toContain("longest gap ${formatDistance(longestGap.len_m)}");
     // Copy shape: "Shortest walk has 45% covered-walkway ratio (30pp lower)"
     expect(source).toContain("${otherLabel} has ${otherPct}% covered-walkway ratio (${magnitude}pp ${direction})");
```

## Verification

Initial focused run failed because two tests still pinned the old live-region/source implementation contract:

```text
Test Files  2 failed (2)
      Tests  2 failed | 39 passed (41)
```

After updating those assertions:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  20:50:03
   Duration  1.70s (transform 952ms, setup 0ms, import 1.21s, tests 383ms, environment 0ms)
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

`git check-ignore -v qa/verification/P432-displayed-walk-live-region.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The score-card live region announced the base sheltered-path covered-walkway ratio even when the visible active display was the shortest walk, so non-visual users could hear `62%` while the visible hero showed `48%`.
2. No-gap live-region evidence previously rendered as `0 m exposed across 0 gaps`; the updated formatter omits that fabricated zero-gap clause.

## DISAGREEMENTS

1. None.
