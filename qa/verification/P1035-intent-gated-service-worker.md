# P1035 Intent-Gated Service Worker

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
5691b44138689f30d808bf6a790b61b4a3673499
```

## Finding

The production service worker still registered on every browser load. That creates a `/sw.js` request for empty first-page visits, including visitors who never search or select a postal. P1035 keeps the service worker available for engaged users, but registers it only after app intent through `shiok:enable-service-worker-cache`.

## Vercel Runtime Log Check

```text
## Runtime Log Counts

**Project:** prj_y6GIQUdEyXXmtg3UTWkcJECKHdEE
**Grouped by:** requestPath

| requestPath | count |
|---|---|
| / | 2 |
```

## Diff

```diff
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 25f063b..185bea4 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -51,6 +51,7 @@ import {
   type RankableScoreRecord,
   type RankMetric,
 } from "../lib/subscore-ranking";
+import { requestServiceWorkerCache } from "../lib/service-worker-cache";
 import styles from "./page.module.css";
 
 const RouteEvidenceMap = dynamic(
@@ -2333,6 +2334,7 @@ export default function Home() {
       setError("This OneMap match has no 6-digit postal code. Choose another match or enter the postal code directly.");
       return;
     }
+    requestServiceWorkerCache();
     setLoading(true);
     setError(null);
     setRouteTransitPois({ type: "FeatureCollection", features: [] });
@@ -2439,6 +2441,7 @@ export default function Home() {
   const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (!query.trim()) return;
+    requestServiceWorkerCache();
 
     const directPostal = normalizePostal(query);
     if (directPostal) {
diff --git a/web/components/service-worker-registration.tsx b/web/components/service-worker-registration.tsx
index 5a7dcbf..0f8cd67 100644
--- a/web/components/service-worker-registration.tsx
+++ b/web/components/service-worker-registration.tsx
@@ -1,13 +1,17 @@
 "use client";
 
 import { useEffect } from "react";
+import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";
 
 export function ServiceWorkerRegistration() {
   useEffect(() => {
     if (process.env.NODE_ENV !== "production") return;
     if (!("serviceWorker" in navigator)) return;
+    let registered = false;
 
     const register = () => {
+      if (registered) return;
+      registered = true;
       navigator.serviceWorker
         .getRegistration("/")
         .then((registration) => {
@@ -19,13 +23,8 @@ export function ServiceWorkerRegistration() {
         });
     };
 
-    if (document.readyState === "complete") {
-      register();
-      return;
-    }
-
-    window.addEventListener("load", register, { once: true });
-    return () => window.removeEventListener("load", register);
+    window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
+    return () => window.removeEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register);
   }, []);
 
   return null;
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index c245c49..b57705b 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -44,20 +44,32 @@ describe("deployment packaging", () => {
     expect(config).toContain('value: "noindex, nofollow, noarchive"');
   });
 
-  it("registers an optional service worker for repeat-visit request reduction", () => {
+  it("registers the optional service worker only after app intent", () => {
     const layout = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
     const registration = readFileSync(
       join(__dirname, "../../components/service-worker-registration.tsx"),
       "utf-8",
     );
+    const page = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
+    const helper = readFileSync(join(__dirname, "../service-worker-cache.ts"), "utf-8");
 
     expect(layout).toContain('import { ServiceWorkerRegistration }');
     expect(layout).toContain("<ServiceWorkerRegistration />");
+    expect(registration).toContain('import { ENABLE_SERVICE_WORKER_CACHE_EVENT } from "../lib/service-worker-cache";');
     expect(registration).toContain('process.env.NODE_ENV !== "production"');
+    expect(registration).toContain("let registered = false;");
+    expect(registration).toContain("if (registered) return;");
     expect(registration).toContain(".getRegistration(\"/\")");
     expect(registration).toContain("if (registration) return registration;");
     expect(registration).toContain('navigator.serviceWorker.register("/sw.js")');
-    expect(registration).toContain('window.addEventListener("load", register, { once: true })');
+    expect(registration).toContain("window.addEventListener(ENABLE_SERVICE_WORKER_CACHE_EVENT, register)");
+    expect(registration).not.toContain('window.addEventListener("load", register');
+    expect(page).toContain('import { requestServiceWorkerCache } from "../lib/service-worker-cache";');
+    expect(helper).toContain('export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";');
+    expect(helper).toContain("export function requestServiceWorkerCache()");
+    expect(helper).toContain("if (typeof window === \"undefined\") return;");
+    expect(helper).toContain("window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));");
+    expect(page).toContain("requestServiceWorkerCache();");
   });
 
   it("keeps the service worker as tracked deployment source", () => {
diff --git a/web/lib/service-worker-cache.ts b/web/lib/service-worker-cache.ts
new file mode 100644
index 0000000..945e61f
--- /dev/null
+++ b/web/lib/service-worker-cache.ts
@@ -0,0 +1,6 @@
+export const ENABLE_SERVICE_WORKER_CACHE_EVENT = "shiok:enable-service-worker-cache";
+
+export function requestServiceWorkerCache() {
+  if (typeof window === "undefined") return;
+  window.dispatchEvent(new Event(ENABLE_SERVICE_WORKER_CACHE_EVENT));
+}
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  81 passed (81)
   Start at  02:29:08
   Duration  3.46s (transform 955ms, setup 0ms, import 1.27s, tests 827ms, environment 1ms)
```

## FINDINGS

1. Production browsers were still eligible to fetch `/sw.js` on empty first-page loads even when the visitor never searched.
2. Runtime logs exposed through the Vercel connector still do not explain the dashboard Edge Request total; over 24 hours they grouped only `/` with count 2.
3. This change reduces first-visit request pressure but delays service-worker repeat-visit caching until user intent.
4. The fix is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
