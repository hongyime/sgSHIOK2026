# P1037 Local MapLibre Styles

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
6f71358e7bfbfbfa27ee25357750a6e0176de3c8
```

## Finding

After P1033 and P1034, empty first-page visits no longer mounted or loaded the route-map component, but `layout.tsx` still imported `maplibre-gl/dist/maplibre-gl.css` globally. P1037 removes that global package CSS import from the root layout and keeps the minimal MapLibre globals used by this app inside `route-evidence-map.module.css`, where they travel with the route-map component path.

## Diff

```diff
diff --git a/web/app/layout.tsx b/web/app/layout.tsx
index 22e5b1a..4b5e1a3 100644
--- a/web/app/layout.tsx
+++ b/web/app/layout.tsx
@@ -1,5 +1,4 @@
 import React from "react";
-import "maplibre-gl/dist/maplibre-gl.css";
 
 const metadataTitle = "S.H.I.O.K. Shelter Map";
 const metadataDescription =
diff --git a/web/components/route-evidence-map.module.css b/web/components/route-evidence-map.module.css
index 3b852d8..6f00b1f 100644
--- a/web/components/route-evidence-map.module.css
+++ b/web/components/route-evidence-map.module.css
@@ -14,6 +14,160 @@
   outline-offset: -6px;
 }
 
+:global(.maplibregl-map) {
+  position: relative;
+  overflow: hidden;
+  font: 12px/20px Helvetica Neue, Arial, Helvetica, sans-serif;
+  -webkit-tap-highlight-color: transparent;
+}
+
+:global(.maplibregl-canvas) {
+  position: absolute;
+  top: 0;
+  left: 0;
+}
+
+:global(.maplibregl-canvas-container.maplibregl-interactive) {
+  cursor: grab;
+  user-select: none;
+}
+
+:global(.maplibregl-canvas-container.maplibregl-interactive:active) {
+  cursor: grabbing;
+}
+
+:global(.maplibregl-ctrl-top-right) {
+  position: absolute;
+  top: 0;
+  right: 0;
+  z-index: 2;
+  pointer-events: none;
+}
+
+:global(.maplibregl-ctrl) {
+  pointer-events: auto;
+}
+
+:global(.maplibregl-ctrl-top-right .maplibregl-ctrl) {
+  margin: 10px 10px 0 0;
+}
+
+:global(.maplibregl-ctrl-group) {
+  overflow: hidden;
+  border-radius: 4px;
+  background: #fff;
+  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
+}
+
+:global(.maplibregl-ctrl-group button) {
+  display: block;
+  width: 29px;
+  height: 29px;
+  border: 0;
+  padding: 0;
+  background: transparent;
+  color: #333;
+  cursor: pointer;
+}
+
+:global(.maplibregl-ctrl-group button + button) {
+  border-top: 1px solid #ddd;
+}
+
+:global(.maplibregl-ctrl-group button:focus-visible) {
+  box-shadow: inset 0 0 0 2px #0096ff;
+  outline: none;
+}
+
+:global(.maplibregl-ctrl button .maplibregl-ctrl-icon) {
+  display: grid;
+  width: 100%;
+  height: 100%;
+  place-items: center;
+  font-size: 20px;
+  font-weight: 700;
+  line-height: 1;
+}
+
+:global(.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon::before) {
+  content: "+";
+}
+
+:global(.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon::before) {
+  content: "-";
+}
+
+:global(.maplibregl-popup) {
+  position: absolute;
+  top: 0;
+  left: 0;
+  display: flex;
+  pointer-events: none;
+  will-change: transform;
+}
+
+:global(.maplibregl-popup-anchor-top),
+:global(.maplibregl-popup-anchor-top-left),
+:global(.maplibregl-popup-anchor-top-right) {
+  flex-direction: column;
+}
+
+:global(.maplibregl-popup-anchor-bottom),
+:global(.maplibregl-popup-anchor-bottom-left),
+:global(.maplibregl-popup-anchor-bottom-right) {
+  flex-direction: column-reverse;
+}
+
+:global(.maplibregl-popup-anchor-left) {
+  flex-direction: row;
+}
+
+:global(.maplibregl-popup-anchor-right) {
+  flex-direction: row-reverse;
+}
+
+:global(.maplibregl-popup-tip) {
+  width: 0;
+  height: 0;
+  border: 10px solid transparent;
+}
+
+:global(.maplibregl-popup-anchor-top .maplibregl-popup-tip) {
+  align-self: center;
+  border-top: none;
+  border-bottom-color: #fff;
+}
+
+:global(.maplibregl-popup-anchor-bottom .maplibregl-popup-tip) {
+  align-self: center;
+  border-bottom: none;
+  border-top-color: #fff;
+}
+
+:global(.maplibregl-popup-anchor-left .maplibregl-popup-tip) {
+  align-self: center;
+  border-left: none;
+  border-right-color: #fff;
+}
+
+:global(.maplibregl-popup-anchor-right .maplibregl-popup-tip) {
+  align-self: center;
+  border-right: none;
+  border-left-color: #fff;
+}
+
+:global(.maplibregl-popup-content) {
+  position: relative;
+  min-width: 160px;
+  max-width: 240px;
+  border-radius: 6px;
+  padding: 10px 12px;
+  background: #fff;
+  color: #17211f;
+  box-shadow: 0 2px 10px rgba(20, 33, 29, 0.18);
+  pointer-events: auto;
+}
+
 .screenReaderOnly {
   position: absolute;
   width: 1px;
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index 3f3d843..c412bbe 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -44,6 +44,20 @@ describe("deployment packaging", () => {
     expect(config).toContain('value: "noindex, nofollow, noarchive"');
   });
 
+  it("keeps MapLibre styles out of the first-load root layout", () => {
+    const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
+    const routeMapStyles = readFileSync(
+      join(__dirname, "../../components/route-evidence-map.module.css"),
+      "utf-8",
+    );
+
+    expect(layout).not.toContain('import "maplibre-gl/dist/maplibre-gl.css"');
+    expect(routeMapStyles).toContain(":global(.maplibregl-map)");
+    expect(routeMapStyles).toContain(":global(.maplibregl-canvas)");
+    expect(routeMapStyles).toContain(":global(.maplibregl-ctrl-top-right)");
+    expect(routeMapStyles).toContain(":global(.maplibregl-popup-content)");
+  });
+
   it("registers the optional service worker directly after app intent", () => {
     const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
     const page = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  82 passed (82)
   Start at  02:39:36
   Duration  3.26s (transform 991ms, setup 0ms, import 1.29s, tests 716ms, environment 1ms)
```

## Build Check Boundary

```text
build_not_run=protected_public_data_boundary
reason=web/scripts/ensure-data-bundle.mjs can create missing derived artifacts under public/data before next build
```

## FINDINGS

1. MapLibre package CSS remained globally imported from the root layout after the route map itself was lazy-loaded.
2. The safer quota shape is to keep only the app's needed MapLibre globals with the route-map component path.
3. A local Next build was not run because the build helper may create missing derived artifacts under `web/public/data`, which is protected against unapproved writes.
4. This change is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
