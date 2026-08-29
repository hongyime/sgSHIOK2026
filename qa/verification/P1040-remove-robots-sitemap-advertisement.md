# P1040 Remove Robots Sitemap Advertisement

## Working Root

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
4527430fea3bd5335539246cc60df4cbef4d8d5c
```

## Finding

The site is a single-page app with a one-URL sitemap. Advertising that sitemap from `robots.txt` can turn a polite crawler visit into an extra `/sitemap.xml` request without discovering any additional useful URL. P1040 keeps the direct sitemap route for clients that ask for it, but stops advertising it from `robots.txt`.

## Diff

```diff
diff --git a/web/app/robots.ts b/web/app/robots.ts
index 5863f5b..460cf6b 100644
--- a/web/app/robots.ts
+++ b/web/app/robots.ts
@@ -47,6 +47,5 @@ export default function robots(): MetadataRoute.Robots {
         crawlDelay: 3600,
       },
     ],
-    sitemap: "https://sgshiok.vercel.app/sitemap.xml",
   };
 }
diff --git a/web/lib/__tests__/deployment.test.ts b/web/lib/__tests__/deployment.test.ts
index 997cd89..6595e66 100644
--- a/web/lib/__tests__/deployment.test.ts
+++ b/web/lib/__tests__/deployment.test.ts
@@ -193,7 +193,7 @@ describe("deployment packaging", () => {
       expect(robots).toContain(disallowedPath);
     }
     expect(robots).toContain("crawlDelay: 3600");
-    expect(robots).toContain('sitemap: "https://sgshiok.vercel.app/sitemap.xml"');
+    expect(robots).not.toContain("sitemap:");
     expect(robots).not.toContain("OAI-SearchBot");
     expect(robots).not.toContain("Claude-SearchBot");
     expect(robots).not.toContain("Googlebot");
@@ -209,9 +209,11 @@ describe("deployment packaging", () => {
     expect(layout).toContain('canonical: "https://sgshiok.vercel.app/"');
   });
 
-  it("publishes a single-page sitemap for polite crawlers", () => {
+  it("keeps a direct sitemap route without advertising it from robots", () => {
+    const robots = readFileSync(join(__dirname, "../../app/robots.ts"), "utf-8");
     const sitemap = readFileSync(join(__dirname, "../../app/sitemap.ts"), "utf-8");
 
+    expect(robots).not.toContain("sitemap:");
     expect(sitemap).toContain('const SITE_URL = "https://sgshiok.vercel.app/";');
     expect(sitemap).toContain("export default function sitemap()");
     expect(sitemap).toContain("url: SITE_URL");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  30 passed (30)
   Start at  02:53:55
   Duration  2.15s (transform 578ms, setup 0ms, import 666ms, tests 168ms, environment 1ms)
```

## FINDINGS

1. `robots.txt` still advertised `/sitemap.xml` even though the sitemap contains only the same root URL that robots already allows.
2. Removing the robots sitemap advertisement can reduce one polite-crawler request per robots discovery path while keeping the direct sitemap route available.
3. This is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
