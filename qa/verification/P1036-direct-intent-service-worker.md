# P1036 Direct Intent Service Worker

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
0d0caad58868ba76c12a51e829ff5d4acb46e0e3
```

## Finding

P1035 stopped automatic `/sw.js` registration on page load, but the root layout still imported a client service-worker component solely to install the intent event listener. P1036 removes that root-layout client island and lets `requestServiceWorkerCache()` register the optional service worker directly after app intent.

## Diff

```diff
diff --git a/web/app/layout.tsx b/web/app/layout.tsx
index 96af406..22e5b1a 100644
--- a/web/app/layout.tsx
+++ b/web/app/layout.tsx
@@ -1,6 +1,5 @@
 import React from "react";
 import "maplibre-gl/dist/maplibre-gl.css";
-import { ServiceWorkerRegistration } from "../components/service-worker-registration";
 
 const metadataTitle = "S.H.I.O.K. Shelter Map";
 const metadataDescription =
@@ -50,7 +49,6 @@ export default function RootLayout({
           flexDirection: "column",
         }}
       >
-        <ServiceWorkerRegistration />
         {children}
       </body>
     </html>
diff --git a/web/components/service-worker-registration.tsx b/web/components/service-worker-registration.tsx
index 0f8cd67..8816525 100644
--- a/web/components/service-worker-registration.tsx
+++ b/web/components/service-worker-registration.tsx
@@ -1,30 +1,11 @@
 "use client";
 
 import { useEffect } from "react";
-import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";
+import { requestServiceWorkerCache } from "../lib/service-worker-cache";
 
 export function ServiceWorkerRegistration() {
   useEffect(() => {
-    if (process.env.NODE_ENV !== "production") return;
-    if (!("serviceWorker" in navigator)) return;
-    let registered = false;
-
-    const register = () => {
-      if (registered) return;
-      registered = true;
-      navigator.serviceWorker
-        .getRegistration("/")
-        .then((registration) => {
-          if (registration) return registration;
-          return navigator.serviceWorker.register("/sw.js");
-        })
-        .catch(() => {
-          // Quota relief is opportunistic; the app must work without SW support.
-        });
-    };
-
-    window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
-    return () => window.removeEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
+    requestServiceWorkerCache();
   }, []);
 
   return null;
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index b57705b..3f3d843 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -44,31 +44,25 @@ describe("deployment packaging", () => {
     expect(config).toContain('value: "noindex, nofollow, noarchive"');
   });
 
-  it("registers the optional service worker only after app intent", () => {
+  it("registers the optional service worker directly after app intent", () => {
     const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
-    const registration = readFileSync(
-      join(__dirname, "../../components/service-worker-registration.tsx"),
-      "utf-8",
-    );
     const page = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
     const helper = readFileSync(join(__dirname, "../service-worker-cache.ts"), "utf-8");
 
-    expect(layout).toContain('import { ServiceWorkerRegistration }');
-    expect(layout).toContain("<ServiceWorkerRegistration />");
-    expect(registration).toContain('import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";');
-    expect(registration).toContain('process.env.NODE_ENV !== "production"');
-    expect(registration).toContain("let registered = false;");
-    expect(registration).toContain("if (registered) return;");
-    expect(registration).toContain(".getRegistration(\"/\")");
-    expect(registration).toContain("if (registration) return registration;");
-    expect(registration).toContain('navigator.serviceWorker.register("/sw.js")');
-    expect(registration).toContain("window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register)");
-    expect(registration).not.toContain('window.addEventListener("load", register');
+    expect(layout).not.toContain('import { ServiceWorkerRegistration }');
+    expect(layout).not.toContain("<ServiceWorkerRegistration />");
     expect(page).toContain('import { requestServiceWorkerCache } from "../lib/service-worker-cache";');
-    expect(helper).toContain('export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";');
+    expect(helper).toContain("let serviceWorkerRegistrationRequested = false;");
     expect(helper).toContain("export function requestServiceWorkerCache()");
     expect(helper).toContain("if (typeof window === \"undefined\") return;");
-    expect(helper).toContain("window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));");
+    expect(helper).toContain('process.env.NODE_ENV !== "production"');
+    expect(helper).toContain('!("serviceWorker" in navigator)');
+    expect(helper).toContain("if (serviceWorkerRegistrationRequested) return;");
+    expect(helper).toContain("serviceWorkerRegistrationRequested = true;");
+    expect(helper).toContain(".getRegistration(\"/\")");
+    expect(helper).toContain("if (registration) return registration;");
+    expect(helper).toContain('navigator.serviceWorker.register("/sw.js")');
+    expect(helper).not.toContain("window.addEventListener");
     expect(page).toContain("requestServiceWorkerCache();");
   });
 
diff --git a/web/lib/service-worker-cache.ts b/web/lib/service-worker-cache.ts
index c5ca28c..b05cc61 100644
--- a/web/lib/service-worker-cache.ts
+++ b/web/lib/service-worker-cache.ts
@@ -1,6 +1,19 @@
-export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";
+let serviceWorkerRegistrationRequested = false;
 
 export function requestServiceWorkerCache() {
   if (typeof window === "undefined") return;
-  window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));
+  if (process.env.NODE_ENV !== "production") return;
+  if (!("serviceWorker" in navigator)) return;
+  if (serviceWorkerRegistrationRequested) return;
+  serviceWorkerRegistrationRequested = true;
+
+  navigator.serviceWorker
+    .getRegistration("/")
+    .then((registration) => {
+      if (registration) return registration;
+      return navigator.serviceWorker.register("/sw.js");
+    })
+    .catch(() => {
+      // Quota relief is opportunistic; the app must work without SW support.
+    });
 }
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  81 passed (81)
   Start at  02:36:30
   Duration  7.14s (transform 1.92s, setup 0ms, import 2.56s, tests 1.65s, environment 2ms)
```

## FINDINGS

1. P1035 still kept a root-layout client component on every page solely to install a service-worker intent listener.
2. Direct intent registration removes that empty-visit client island and still avoids `/sw.js` until user intent.
3. This is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
