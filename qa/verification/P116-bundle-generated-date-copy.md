# P116 Bundle Generated Date Copy

## Scope

Browser copy/formatting only. No scoring, export, rescore, subset run, ingest, network build, public data write, deployment, or locked weight change.

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Check Ignore

```text
exit=1
```

## Manifest Shape

```text
top-level keys:
data_as_of
generated_at
geom
provenance
scores
transit
--- data_as_of ---

Sunday, 2 August 2026 5:49:20 am
```

## Change

The title-card date line now displays both route-evidence `data_as_of` and bundle `generated_at`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 54487e5..3e2f78f 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -242,6 +242,15 @@ function formatDataDate(manifest: Manifest | null): string {
   });
 }
 
+function formatGeneratedDate(manifest: Manifest | null): string {
+  if (!manifest?.generated_at) return "Unavailable";
+  return new Date(manifest.generated_at).toLocaleDateString("en-SG", {
+    day: "numeric",
+    month: "short",
+    year: "numeric",
+  });
+}
+
 function resultTitle(result: SearchResult): string {
   if (result.BUILDING && result.BUILDING !== "N/A") return toProperCase(result.BUILDING);
   return result.SEARCHVAL || `S${result.POSTAL}`;
@@ -1991,7 +2000,9 @@ export default function Home() {
           <div>
             <h1>S.H.I.O.K. Index</h1>
             <p>Shelter-first walks to transit</p>
-            <p className={styles.dataLine}>Route evidence as of {formatDataDate(manifest)}</p>
+            <p className={styles.dataLine}>
+              Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}
+            </p>
             <p className={styles.freshnessLine}>
               Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; measured recent-source misses exist.
             </p>
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index f236e2d..dd564d2 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -41,7 +41,10 @@ describe("score card copy", () => {
     expect(source).toContain('placeholder="Search address or 6-digit postal"');
     expect(source).toContain('aria-label="Search address or 6-digit postal"');
     expect(source).not.toContain("Singapore walk-to-transit comfort");
-    expect(source).toContain("Route evidence as of {formatDataDate(manifest)}");
+    expect(source).toContain(
+      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
+    );
+    expect(source).toContain("function formatGeneratedDate(manifest: Manifest | null): string");
     expect(source).toContain("Locked score ${scoreText}");
     expect(source).toContain(
       "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; measured recent-source misses exist."
```

## Findings

1. The active manifest already carries both `data_as_of` and `generated_at`, but the browser only surfaced `data_as_of`. P116 adds the bundle generation date so users can distinguish source age from bundle build age.

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:13:43
   Duration  996ms (transform 132ms, setup 0ms, import 172ms, tests 59ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:13:54
   Duration  10.74s (transform 9.04s, setup 0ms, import 13.18s, tests 15.10s, environment 19ms)
```

## Safety Checks

```text
git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0
```

```text
git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0
```

```text
python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Disagreements

1. None.
