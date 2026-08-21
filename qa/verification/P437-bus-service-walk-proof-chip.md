# P437 Bus Service Walk Proof Chip

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

The bus fallback reason chip said `Nearby bus service not walk-verified`. The limitation is clearer as nearby bus service without a verified shelter-map walk.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 4d8af0d..8cc1988 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -797,7 +797,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
     measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on sheltered walk`);
   }
   if (busFallback) {
-    measuredReasons.push("Nearby bus service not walk-verified");
+    measuredReasons.push("Nearby bus service without verified shelter-map walk");
     measuredReasons.push(busFallbackSummary(busFallback));
   }
 
@@ -809,7 +809,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
   if (busFallback && values[0]?.key === "bus") {
     const shelterReason = measuredReasons.find((reason) => reason.includes("covered-walkway ratio"));
     return [
-      "Nearby bus service not walk-verified",
+      "Nearby bus service without verified shelter-map walk",
       shelterReason ?? measuredReasons[0] ?? busFallbackSummary(busFallback),
     ];
   }
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index a8b2248..262c8e7 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -814,7 +814,7 @@ describe("rendered accessibility output", () => {
       rankingRecords: [contradictionRecord],
     });
 
-    expect(html).toContain("Nearby bus service not walk-verified");
+    expect(html).toContain("Nearby bus service without verified shelter-map walk");
     expect(html).toContain("62% covered-walkway ratio on sheltered walk");
     expect(html).not.toContain("62% covered-walkway ratio on selected walk");
     expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
@@ -823,6 +823,7 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("Shelter-map walk access was not verified, so the locked bus term remains 0.");
     expect(html).not.toContain("so this component score remains 0");
     expect(html).not.toContain("Nearby bus service not route-verified");
+    expect(html).not.toContain("Nearby bus service not walk-verified");
     expect(html).not.toContain("62% sheltered on sheltered route");
     expect(html).not.toContain("Shelter-map route access was not verified");
     expect(html).not.toContain("so this sub-score remains 0");
@@ -852,6 +853,7 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Limited bus-service evidence");
     expect(html).not.toContain("Limited bus connectivity");
+    expect(html).not.toContain("Nearby bus service without verified shelter-map walk");
     expect(html).not.toContain("Nearby bus service not walk-verified");
     expect(html).not.toContain("Nearby bus service not route-verified");
     expect(html).not.toContain("Nearby bus evidence not route-verified");
@@ -913,19 +915,23 @@ describe("rendered accessibility output", () => {
     });
 
     expect(flaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
+    expect(flaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
     expect(flaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
     expect(flaggedBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
     expect(unflaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
+    expect(unflaggedBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
     expect(unflaggedBusHtml).not.toContain("Nearby bus service not walk-verified");
     expect(unflaggedBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
 
-    expect(flaggedNoBusHtml).toContain("Nearby bus service not walk-verified");
+    expect(flaggedNoBusHtml).toContain("Nearby bus service without verified shelter-map walk");
+    expect(flaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
     expect(flaggedNoBusHtml).toContain("62% covered-walkway ratio on sheltered walk");
     expect(flaggedNoBusHtml).not.toContain("62% covered-walkway ratio on selected walk");
     expect(unflaggedNoBusHtml).toContain("Limited bus-service evidence");
     expect(unflaggedNoBusHtml).not.toContain("Limited bus connectivity");
+    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service without verified shelter-map walk");
     expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not walk-verified");
     expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 6f5c225..a34865b 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -443,6 +443,8 @@ describe("score card copy", () => {
     expect(source).toContain(
       "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
     );
+    expect(source).toContain("Nearby bus service without verified shelter-map walk");
+    expect(source).not.toContain("Nearby bus service not walk-verified");
     expect(source).not.toContain("trusted walk to a DataMall bus stop");
     expect(source).toContain('bus: { low: "Limited bus-service evidence", high: "Stronger bus-service evidence" }');
     expect(source).not.toContain("Limited bus connectivity");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  21:15:51
   Duration  2.52s (transform 1.14s, setup 0ms, import 1.69s, tests 510ms, environment 1ms)
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

`git check-ignore -v qa/verification/P437-bus-service-walk-proof-chip.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The bus fallback reason chip used the terse phrase `Nearby bus service not walk-verified`; the clearer user-facing limitation is nearby bus service without a verified shelter-map walk.

## DISAGREEMENTS

1. None.
