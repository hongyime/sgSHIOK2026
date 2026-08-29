# P1038 Remove Service Worker Dead Component

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
4f1fc3a05068334198f5b910b499f573cb2ca258
```

## Finding

After P1036, `web/components/service-worker-registration.tsx` was no longer imported by the root layout or app page. Keeping it created a stale client-island path that could be reintroduced later. P1038 deletes the unused component and pins the root-layout absence in the deployment test.

## Diff

```diff
diff --git a/web/components/service-worker-registration.tsx b/web/components/service-worker-registration.tsx
deleted file mode 100644
index 8816525..0000000
--- a/web/components/service-worker-registration.tsx
+++ /dev/null
@@ -1,12 +0,0 @@
-"use client";
-
-import { useEffect } from "react";
-import { requestServiceWorkerCache } from "../lib/service-worker-cache";
-
-export function ServiceWorkerRegistration() {
-  useEffect(() => {
-    requestServiceWorkerCache();
-  }, []);
-
-  return null;
-}
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index c412bbe..1570372 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -65,6 +65,7 @@ describe("deployment packaging", () => {
 
     expect(layout).not.toContain('import { ServiceWorkerRegistration }');
     expect(layout).not.toContain("<ServiceWorkerRegistration />");
+    expect(layout).not.toContain("../components/service-worker-registration");
     expect(page).toContain('import { requestServiceWorkerCache } from "../lib/service-worker-cache";');
     expect(helper).toContain("let serviceWorkerRegistrationRequested = false;");
     expect(helper).toContain("export function requestServiceWorkerCache()");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  82 passed (82)
   Start at  02:44:25
   Duration  7.21s (transform 1.93s, setup 0ms, import 2.49s, tests 1.50s, environment 2ms)
```

```text
npm notice run shiok-web@0.1.0 npx
npm notice run next build
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 102ms
Warning: Custom Cache-Control headers detected for the following routes:
  - /_next/static/:path*

Setting a custom Cache-Control header can break Next.js development behavior.

  Creating an optimized production build ...
✓ Compiled successfully in 25.8s
  Running TypeScript ...
  Finished TypeScript in 4.2s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/8) ...
  Generating static pages using 7 workers (2/8) 
  Generating static pages using 7 workers (4/8) 
  Generating static pages using 7 workers (6/8) 
✓ Generating static pages using 7 workers (8/8) in 1739ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
├ ○ /icon.svg
├ ○ /robots.txt
└ ○ /sitemap.xml


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```text
protected_data_status_after_build=no_output
```

## FINDINGS

1. `ServiceWorkerRegistration` became unused after direct intent registration and should not remain as a stale root-layout client-island path.
2. Direct `next build` from `web/` validates the prior MapLibre CSS move without invoking `web/scripts/ensure-data-bundle.mjs`.
3. This change is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
