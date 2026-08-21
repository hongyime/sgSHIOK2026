# P369 greenery proxy walk-adjacent copy

## Working root guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence path ignore check

```text
False
check_ignore_exit=1
```

## Change inspection

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 180528a..d05a32e 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1191,7 +1191,7 @@ export function ScoreCard({
   if (shadeProxyPct !== null) {
     routeDetailItems.push({ label: "Greenery proxy", value: `${shadeProxyPct}%` });
     routeDetailNotes.push(
-      "Greenery proxy uses sparse NParks route geometry for heat only; it is not measured temperature or Leaf Area Index."
+      "Greenery proxy uses sparse NParks walk-adjacent greenery geometry for heat only; it is not measured temperature or Leaf Area Index."
     );
   }
   if (score.paths) {
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index b232d69..3b828a5 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -458,8 +458,9 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("Heat proxy evidence: covered 149 m; greenery proxy 23 m.");
     expect(html).not.toContain("Better heat-proxy score");
     expect(html).toContain(
-      "Greenery proxy uses sparse NParks route geometry for heat only; it is not measured temperature or Leaf Area Index."
+      "Greenery proxy uses sparse NParks walk-adjacent greenery geometry for heat only; it is not measured temperature or Leaf Area Index."
     );
+    expect(html).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
     expect(html).toContain("Night lighting");
     expect(html).toContain("Map layer off");
     expect(html).not.toContain("Map layer on; zoom in for points");
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index d4c342f..c5373a7 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -292,8 +292,9 @@ describe("score card copy", () => {
     expect(tsxSource).toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
     expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
     expect(tsxSource).toContain(
-      "Greenery proxy uses sparse NParks route geometry for heat only; it is not measured temperature or Leaf Area Index."
+      "Greenery proxy uses sparse NParks walk-adjacent greenery geometry for heat only; it is not measured temperature or Leaf Area Index."
     );
+    expect(tsxSource).not.toContain("Greenery proxy uses sparse NParks route geometry for heat only");
     expect(tsxSource).toContain("routeDetailItems.push({ label: \"Snap connector\"");
     expect(tsxSource).toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for points" : "Map layer off",');
     expect(tsxSource).not.toContain('routeDetailItems.push({ label: "Night lighting", value: lampOverlayEnabled ? "Layer on" : "Layer off" });');
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  36 passed (36)
   Start at  15:14:59
   Duration  2.26s (transform 1.16s, setup 0ms, import 1.49s, tests 409ms, environment 2ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The selected-walk details still described the greenery proxy as `route geometry`, even though the detail strip and product framing now use selected-walk language.
2. The corrected copy keeps the technical boundary intact: sparse NParks geometry, heat only, not measured temperature, and not Leaf Area Index.

## DISAGREEMENTS

1. None.
