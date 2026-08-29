# P1033 Defer Empty Route Map

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
c1163d1f336ae50c182dfe5ce389312ae4289837
```

## Finding

Empty first-page visits mounted `RouteEvidenceMap`, which dynamically imports MapLibre and initializes the OneMap raster basemap even before a selected postal route exists. P1033 keeps the first-screen search and shelter-map panel visible, but defers the route map until `mapRoutes.length > 0`.

## Diff

```diff
diff --git a/web/app/page.tsx b/web/app/page.tsx
index be3694d..bb13b5a 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -2308,6 +2308,7 @@ export default function Home() {
 
   const mapRoutes = useMemo(() => buildRouteItems(activeSelection), [activeSelection]);
   const mapRouteMode = routesAreSame(activeSelection) ? "shiokest" : routeMode;
+  const shouldRenderRouteMap = mapRoutes.length > 0;
   const showDetailOverlay = Boolean(primary);
 
   // Apply pending URL stop once candidates for this postal are known.
@@ -2525,18 +2526,20 @@ export default function Home() {
 
   return (
     <main className={styles.appShell}>
-      <RouteEvidenceMap
-        routes={mapRoutes}
-        mode={mapRouteMode}
-        transitPois={mapTransitPois}
-        feedbackEnabled={feedbackEnabled}
-        feedbackPoints={feedbackPoints}
-        onFeedbackPoint={addFeedbackPoint}
-        onSelectTransitStop={handleStopSelect}
-        chosenStopId={chosenStopId ?? bestCandidateId}
-        showLampOverlay={lampOverlayEnabled}
-        focusedExposureGap={focusedExposureGap}
-      />
+      {shouldRenderRouteMap && (
+        <RouteEvidenceMap
+          routes={mapRoutes}
+          mode={mapRouteMode}
+          transitPois={mapTransitPois}
+          feedbackEnabled={feedbackEnabled}
+          feedbackPoints={feedbackPoints}
+          onFeedbackPoint={addFeedbackPoint}
+          onSelectTransitStop={handleStopSelect}
+          chosenStopId={chosenStopId ?? bestCandidateId}
+          showLampOverlay={lampOverlayEnabled}
+          focusedExposureGap={focusedExposureGap}
+        />
+      )}
 
       <section className={styles.searchOverlay} aria-label="Address search" aria-busy={loading}>
         <div className={styles.brandRow}>
diff --git a/web/lib/__tests__/route-evidence-map-interaction.test.ts b/web/lib/__tests__/route-evidence-map-interaction.test.ts
index 6554ea0..2d59b5b 100644
--- a/web/lib/__tests__/route-evidence-map-interaction.test.ts
+++ b/web/lib/__tests__/route-evidence-map-interaction.test.ts
@@ -89,6 +89,8 @@ describe("shelter map interactions", () => {
     expect(pageSource).toContain("useState<Manifest | null>(PINNED_DATA_MANIFEST)");
     expect(pageSource).not.toContain("void fetchManifest().then");
     expect(pageSource).not.toContain("void fetchTransitPois().then");
+    expect(pageSource).toContain("const shouldRenderRouteMap = mapRoutes.length > 0;");
+    expect(pageSource).toContain("{shouldRenderRouteMap && (");
     expect(pageSource).toContain("nearbyTransitPois = await fetchTransitPois();");
     expect(pageSource).toContain("setBaseTransitPois(nearbyTransitPois);");
 
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  52 passed (52)
   Start at  02:20:04
   Duration  26.92s (transform 16.13s, setup 0ms, import 20.35s, tests 2.74s, environment 2ms)
```

## FINDINGS

1. Empty first-page visits were still eligible to initialize MapLibre and request OneMap raster basemap tiles before any postal route existed.
2. The fix is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
