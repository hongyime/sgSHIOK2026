# P1039 Hourly Crawler Delay

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
6bfa8fb7aedc676b179039f465e3cdd58cc0ecfe
```

## Finding

The app is a single-page public surface and was already publishing a one-page sitemap. Under Vercel Hobby Edge Request pressure, a 300-second general crawl delay is still more permissive than the product needs. P1039 raises the polite-crawler crawl delay to 3600 seconds while keeping `/` allowed and keeping Googlebot/Bingbot out of the blocklist.

## Diff

```diff
diff --git a/web/app/robots.ts b/web/app/robots.ts
index 0a6f352..5863f5b 100644
--- a/web/app/robots.ts
+++ b/web/app/robots.ts
@@ -44,7 +44,7 @@ export default function robots(): MetadataRoute.Robots {
           "/manifest.json",
           "/*?*",
         ],
-        crawlDelay: 300,
+        crawlDelay: 3600,
       },
     ],
     sitemap: "https://sgshiok.vercel.app/sitemap.xml",
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index 1570372..997cd89 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -192,7 +192,7 @@ describe("deployment packaging", () => {
     ]) {
       expect(robots).toContain(disallowedPath);
     }
-    expect(robots).toContain("crawlDelay: 300");
+    expect(robots).toContain("crawlDelay: 3600");
     expect(robots).toContain('sitemap: "https://sgshiok.vercel.app/sitemap.xml"');
     expect(robots).not.toContain("OAI-SearchBot");
     expect(robots).not.toContain("Claude-SearchBot");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  30 passed (30)
   Start at  02:50:29
   Duration  2.16s (transform 143ms, setup 0ms, import 185ms, tests 174ms, environment 0ms)
```

## FINDINGS

1. The current crawler policy still allowed polite general crawlers to revisit at a five-minute cadence, which is unnecessarily permissive for a one-page app under quota pressure.
2. `Crawl-delay` is advisory and ignored by some major crawlers; this is not a hard Vercel Edge Request cap.
3. This change is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
