# P428 Exposure Hero Ratio Copy

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

The issue was the exposure hero headline rendering as `62% of the selected walk is covered.` That is technically correct, but it obscures the product's primary metric and becomes awkward when the selected walk is already labelled `sheltered walk`.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index b72a7fb..8a32577 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1394,7 +1394,7 @@ export function ScoreCard({
       {score.paths && (
         <div className={styles.exposureHero} aria-label="Walk shelter evidence">
           <span>Where the walk is exposed</span>
-          <strong>{formatPercent(selectedCoverage)} of the {selectedWalkLabel} is covered.</strong>
+          <strong>{formatPercent(selectedCoverage)} covered-walkway ratio on the {selectedWalkLabel}.</strong>
           <p>{exposureHeroText}</p>
         </div>
       )}
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 7f9947e..eddbf38 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -427,7 +427,8 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Where the walk is exposed");
     expect(html).toContain('aria-label="Walk shelter evidence"');
-    expect(html).toContain("62% of the selected walk is covered.");
+    expect(html).toContain("62% covered-walkway ratio on the selected walk.");
+    expect(html).not.toContain("62% of the selected walk is covered.");
     expect(html).toContain("181 m exposed across 2 gaps; 142 m is the longest exposed gap.");
     expect(html).toContain("142 m is the longest exposed gap.");
     expect(html).toContain('aria-label="Shelter source evidence"');
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  23 passed (23)
   Start at  20:27:13
   Duration  1.91s (transform 799ms, setup 0ms, import 1.09s, tests 319ms, environment 0ms)
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

`git check-ignore -v qa/verification/P428-exposure-hero-ratio-copy.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The exposure hero was still phrased as a generic covered percentage rather than naming the covered-walkway ratio, which weakened the shelter-first metric in the most important card.

## DISAGREEMENTS

1. None.
