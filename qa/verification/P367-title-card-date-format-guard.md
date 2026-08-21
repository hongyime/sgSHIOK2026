# P367 title card date format guard

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
index d1bd95b..31dd8fe 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -283,7 +283,7 @@ function normalizePostal(value: string): string | null {
   return trimmed.padStart(6, "0");
 }
 
-function formatDataDate(manifest: Manifest | null): string {
+export function formatDataDate(manifest: Manifest | null): string {
   if (!manifest?.data_as_of) return "Unavailable";
   return new Date(manifest.data_as_of).toLocaleDateString("en-SG", {
     day: "numeric",
@@ -292,7 +292,7 @@ function formatDataDate(manifest: Manifest | null): string {
   });
 }
 
-function formatGeneratedDate(manifest: Manifest | null): string {
+export function formatGeneratedDate(manifest: Manifest | null): string {
   if (!manifest?.generated_at) return "Unavailable";
   return new Date(manifest.generated_at).toLocaleDateString("en-SG", {
     day: "numeric",
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index b22f84d..b232d69 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -10,6 +10,8 @@ vi.mock("next/navigation", () => ({
 import {
   ScoreCard,
   SearchFeedback,
+  formatDataDate,
+  formatGeneratedDate,
   routeDisplayAnnouncement,
   scoreCardAnnouncement,
   searchResultsAnnouncement,
@@ -116,6 +118,19 @@ function renderScoreCard(overrides: Partial<React.ComponentProps<typeof ScoreCar
 }
 
 describe("rendered accessibility output", () => {
+  it("formats manifest data dates for the title-card honesty line", () => {
+    const manifest = {
+      generated_at: "2026-08-05T14:00:15.974693+00:00",
+      data_as_of: "2026-08-01T21:49:20.977890+00:00",
+      provenance: {},
+    };
+
+    expect(formatDataDate(manifest)).toBe("2 Aug 2026");
+    expect(formatGeneratedDate(manifest)).toBe("5 Aug 2026");
+    expect(formatDataDate(null)).toBe("Unavailable");
+    expect(formatGeneratedDate(null)).toBe("Unavailable");
+  });
+
   it("renders visible map attribution instead of relying on source-only checks", () => {
     const html = renderToStaticMarkup(
       <RouteEvidenceMap
```

## Initial failed expectation

```text
AssertionError: expected '2 Aug 2026' to be '1 Aug 2026' // Object.is equality

Expected: "1 Aug 2026"
Received: "2 Aug 2026"
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  15:06:41
   Duration  1.97s (transform 794ms, setup 0ms, import 1.05s, tests 372ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The title-card date formatter was only source-string checked before P367; no test proved the formatted user-visible data-as-of and generated dates.
2. The current manifest `data_as_of` timestamp is late on 1 Aug UTC and renders as `2 Aug 2026` in the Singapore user-facing locale.

## DISAGREEMENTS

1. None.
