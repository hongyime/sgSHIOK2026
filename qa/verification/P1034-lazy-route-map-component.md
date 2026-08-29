# P1034 Lazy Route Map Component

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
54220ca31d7f6cc5c5a78bf397278951e6a6488c
```

## Finding

After P1033, the route map no longer mounted on empty first-page visits, but `page.tsx` still statically imported the route-map module. P1034 changes the route map to a Next dynamic import so empty visits do not need the map component code path until a selected route exists.

## Diff

```diff
diff --git a/web/app/page.tsx b/web/app/page.tsx
index bb13b5a..25f063b 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1,6 +1,7 @@
 "use client";
 
 import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
+import dynamic from "next/dynamic";
 import { usePathname } from "next/navigation";
 import {
   fetchGeomForPostal,
@@ -22,12 +23,11 @@ import type {
   TransitAccessMode,
   TransitPoiCollection,
 } from "../lib/types";
-import {
-  RouteEvidenceMap,
-  type FocusedExposureGap,
-  type FeedbackPoint,
-  type RouteDisplayMode,
-  type RouteMapItem,
+import type {
+  FocusedExposureGap,
+  FeedbackPoint,
+  RouteDisplayMode,
+  RouteMapItem,
 } from "../components/route-evidence-map";
 import {
   deriveNearestTransitCandidates,
@@ -53,6 +53,11 @@ import {
 } from "../lib/subscore-ranking";
 import styles from "./page.module.css";
 
+const RouteEvidenceMap = dynamic(
+  () => import("../components/route-evidence-map").then((module) => module.RouteEvidenceMap),
+  { ssr: false }
+);
+
 export interface LoadedSelection {
   result: SearchResult;
   score: ScoreRecord | null;
diff --git a/web/lib/__tests__/route-evidence-map-interaction.test.ts b/web/lib/__tests__/route-evidence-map-interaction.test.ts
index 2d59b5b..19fa5ce 100644
--- a/web/lib/__tests__/route-evidence-map-interaction.test.ts
+++ b/web/lib/__tests__/route-evidence-map-interaction.test.ts
@@ -89,6 +89,9 @@ describe("shelter map interactions", () => {
     expect(pageSource).toContain("useState<Manifest | null>(PINNED_DATA_MANIFEST)");
     expect(pageSource).not.toContain("void fetchManifest().then");
     expect(pageSource).not.toContain("void fetchTransitPois().then");
+    expect(pageSource).toContain('import dynamic from "next/dynamic";');
+    expect(pageSource).toContain("const RouteEvidenceMap = dynamic(");
+    expect(pageSource).toContain('import("../components/route-evidence-map").then((module) => module.RouteEvidenceMap)');
     expect(pageSource).toContain("const shouldRenderRouteMap = mapRoutes.length > 0;");
     expect(pageSource).toContain("{shouldRenderRouteMap && (");
     expect(pageSource).toContain("nearbyTransitPois = await fetchTransitPois();");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  52 passed (52)
   Start at  02:23:27
   Duration  4.18s (transform 1.17s, setup 0ms, import 1.81s, tests 1.02s, environment 1ms)
```

## FINDINGS

1. The route-map module could still be part of the empty-page client path through a static `page.tsx` import even after the map mount was deferred.
2. The fix is source-side only and is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
