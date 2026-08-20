# P113 Bus Fallback Route-Access Copy

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

Direct-bus fallback copy now says `Nearby bus service not route-verified` and `Walking-route access was not verified` instead of `Nearby bus evidence not route-verified` and `Walking network access was not verified`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 1280b13..1ab0001 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -700,7 +700,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
     measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% sheltered on sheltered route`);
   }
   if (busFallback) {
-    measuredReasons.push("Nearby bus evidence not route-verified");
+    measuredReasons.push("Nearby bus service not route-verified");
     measuredReasons.push(busFallbackSummary(busFallback));
   }
 
@@ -712,7 +712,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
   if (busFallback && values[0]?.key === "bus") {
     const shelterReason = measuredReasons.find((reason) => reason.includes("sheltered"));
     return [
-      "Nearby bus evidence not route-verified",
+      "Nearby bus service not route-verified",
       shelterReason ?? measuredReasons[0] ?? busFallbackSummary(busFallback),
     ];
   }
@@ -1186,7 +1186,7 @@ export function ScoreCard({
           notes: [
             "A low value can mean weak service evidence, or that routing could not prove a trusted walk to a DataMall bus stop.",
             busFallback
-              ? `${busFallbackSummary(busFallback)} Walking network access was not verified, so this sub-score remains 0.`
+              ? `${busFallbackSummary(busFallback)} Walking-route access was not verified, so this sub-score remains 0.`
               : null,
           ].filter((note): note is string => Boolean(note)),
         },
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 377231c..b3478f0 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -427,11 +427,12 @@ describe("rendered accessibility output", () => {
       rankingRecords: [contradictionRecord],
     });
 
-    expect(html).toContain("Nearby bus evidence not route-verified");
+    expect(html).toContain("Nearby bus service not route-verified");
     expect(html).toContain("62% sheltered on sheltered route");
     expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
     expect(html).not.toContain("direct bus candidates found");
-    expect(html).toContain("Walking network access was not verified, so this sub-score remains 0.");
+    expect(html).toContain("Walking-route access was not verified, so this sub-score remains 0.");
+    expect(html).not.toContain("Walking network access was not verified");
     expect(html).toContain("Locked score caveat: the bus term remains 0");
     expect(html).toContain("Bus service support");
     expect(html).toContain("20%");
@@ -454,6 +455,7 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain("Limited bus connectivity");
+    expect(html).not.toContain("Nearby bus service not route-verified");
     expect(html).not.toContain("Nearby bus evidence not route-verified");
     expect(html).not.toContain("Walking network access was not verified");
     expect(html).toContain("Bus service support");
@@ -513,13 +515,16 @@ describe("rendered accessibility output", () => {
     });
 
     expect(flaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
+    expect(flaggedBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
     expect(unflaggedBusHtml).not.toContain("not derived from a verified pedestrian route");
+    expect(unflaggedBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
 
-    expect(flaggedNoBusHtml).toContain("Nearby bus evidence not route-verified");
+    expect(flaggedNoBusHtml).toContain("Nearby bus service not route-verified");
     expect(flaggedNoBusHtml).toContain("62% sheltered on sheltered route");
     expect(unflaggedNoBusHtml).toContain("Limited bus connectivity");
+    expect(unflaggedNoBusHtml).not.toContain("Nearby bus service not route-verified");
     expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
   });
 });
```

## Stale Phrase Search

```text
web/lib/__tests__/accessibility-render.test.tsx:435:    expect(html).not.toContain("Walking network access was not verified");
web/lib/__tests__/accessibility-render.test.tsx:459:    expect(html).not.toContain("Nearby bus evidence not route-verified");
web/lib/__tests__/accessibility-render.test.tsx:460:    expect(html).not.toContain("Walking network access was not verified");
web/lib/__tests__/accessibility-render.test.tsx:519:    expect(flaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
web/lib/__tests__/accessibility-render.test.tsx:522:    expect(unflaggedBusHtml).not.toContain("Nearby bus evidence not route-verified");
web/lib/__tests__/accessibility-render.test.tsx:528:    expect(unflaggedNoBusHtml).not.toContain("Nearby bus evidence not route-verified");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  21:03:40
   Duration  3.67s (transform 1.56s, setup 0ms, import 2.05s, tests 458ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:03:56
   Duration  8.70s (transform 6.16s, setup 0ms, import 9.26s, tests 11.71s, environment 14ms)
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

1. Direct-bus fallback copy still included a walking-network implementation phrase in rendered UI. P113 changes it to walking-route access while keeping the conservative bus subscore caveat.

## Disagreements

1. None.
