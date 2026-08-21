# P371 map empty search copy

## Root guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change diff

```diff
diff --git a/web/components/route-evidence-map.tsx b/web/components/route-evidence-map.tsx
index fc39fe4..89cd643 100644
--- a/web/components/route-evidence-map.tsx
+++ b/web/components/route-evidence-map.tsx
@@ -1034,7 +1034,7 @@ function mapTextSummary(
     return [
       `Singapore map with ${poiText}.`,
       lampText,
-      "Search a OneMap address or 6-digit postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.",
+      "Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, night lighting, and nearby transit.",
     ].filter(Boolean).join(" ");
   }
 
diff --git a/web/lib/__tests__/route-evidence-map-interaction.test.ts b/web/lib/__tests__/route-evidence-map-interaction.test.ts
index 4c2fb35..ca578c8 100644
--- a/web/lib/__tests__/route-evidence-map-interaction.test.ts
+++ b/web/lib/__tests__/route-evidence-map-interaction.test.ts
@@ -44,8 +44,9 @@ describe("shelter map interactions", () => {
     expect(source).not.toContain("Singapore shelter map with MRT stations, LRT stations, and bus stops");
     expect(source).toContain("Shelter map for ${labels}, showing ${routeModeLabel(mode)}");
     expect(source).toContain("Shelter map for ${routeLabels}.");
-    expect(source).toContain("Search a OneMap address or 6-digit postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
+    expect(source).toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
     expect(source).not.toContain("Search for a postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
+    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to show covered-walkway ratio, exposed gaps, night lighting, and nearby transit.");
     expect(source).not.toContain("Singapore transit map with MRT stations, LRT stations, and bus stops");
     expect(source).not.toContain('return "sheltered route";');
     expect(source).not.toContain('return "shortest and sheltered routes";');
```

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  15:24:33
   Duration  3.80s (transform 1.49s, setup 0ms, import 534ms, tests 1.36s, environment 1ms)
```

## Repo integrity

```text
repo_integrity=ok
exit_code=0
```

## Weights guard

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. The first-view title card and the map empty-state summary used different verbs for the same starting action: `inspect` in the title card and `show` in the map summary.
2. Aligning the map empty-state summary keeps the initial no-selection experience consistent without changing data, scoring, export, or bundle files.

## DISAGREEMENTS

1. None.
