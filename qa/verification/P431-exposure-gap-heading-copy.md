# P431 Exposure Gap Heading Copy

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
- `web/lib/__tests__/score-card-copy.test.ts`

The exposed-gap section heading still said `Exposed gaps on this walk` after P429/P430 made the hero, gap summary, no-gap fallback, and reason chips name the actual displayed walk.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 4cbadb9..23341e7 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1613,7 +1613,7 @@ export function ScoreCard({
 
       {exposureGaps.length > 0 && (
         <div className={styles.gapList}>
-          <h3>Exposed gaps on this walk</h3>
+          <h3>Exposed gaps on {selectedWalkLabel}</h3>
           <p className={styles.gapSummary}>
             <span>{gapSummaryText}</span>
             <span>{gapListScopeText}</span>
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 602e4cd..5a7af3e 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -597,7 +597,8 @@ describe("rendered accessibility output", () => {
   it("renders exposed gap lengths with coordinates", () => {
     const html = renderScoreCard();
 
-    expect(html).toContain("Exposed gaps on this walk");
+    expect(html).toContain("Exposed gaps on sheltered walk");
+    expect(html).not.toContain("Exposed gaps on this walk");
     expect(html).toContain("142 m");
     expect(html).toContain("181 m exposed across 2 gaps on the sheltered walk.");
     expect(html).not.toContain("181 m exposed across 2 gaps on the selected walk.");
@@ -636,6 +637,7 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("No exposed gaps are recorded for this shortest walk.");
     expect(html).not.toContain("No exposed gaps are recorded for this selected walk.");
+    expect(html).not.toContain("Exposed gaps on this walk");
   });
 
   it("labels transit target availability before a user switches modes", () => {
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 89d1692..bac57c3 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -233,7 +233,8 @@ describe("score card copy", () => {
     expect(source).toContain("ATTRIBUTION.md");
     expect(source).toContain("Heat proxy: shelter plus sparse NParks greenery, not measured temperature");
     expect(source).toContain("Night lighting");
-    expect(source).toContain("Exposed gaps on this walk");
+    expect(source).toContain("Exposed gaps on {selectedWalkLabel}");
+    expect(source).not.toContain("Exposed gaps on this walk");
     expect(source).toContain("include map coordinates.");
     expect(source).toContain(
       "Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score."
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  20:44:34
   Duration  3.61s (transform 1.98s, setup 0ms, import 2.42s, tests 879ms, environment 1ms)
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

`git check-ignore -v qa/verification/P431-exposure-gap-heading-copy.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The exposed-gap section heading still used generic `this walk` wording after the surrounding exposure copy had become specific to the displayed walk.
2. The first attempted no-gap assertion incorrectly expected the gap list heading to render for a no-gap record; the actual UI intentionally omits the list when there are no exposed gaps and uses the hero fallback instead.

## DISAGREEMENTS

1. None.
