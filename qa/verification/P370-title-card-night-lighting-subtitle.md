# P370 title card night-lighting subtitle

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
index d05a32e..86b9679 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -2080,7 +2080,7 @@ export default function Home() {
         <div className={styles.brandRow}>
           <div>
             <h1>S.H.I.O.K. Shelter Map</h1>
-            <p>See covered-walkway ratio and exposed gaps to transit</p>
+            <p>See covered-walkway ratio, exposed gaps, and night lighting near transit</p>
             <p className={styles.dataLine}>
               Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}
             </p>
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index c5373a7..2f235b1 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -127,7 +127,8 @@ describe("score card copy", () => {
     expect(layoutSource).toContain('url: "https://sgshiok.vercel.app/"');
     expect(layoutSource).toContain('card: "summary"');
     expect(layoutSource).not.toContain('title: "S.H.I.O.K. Index"');
-    expect(source).toContain("See covered-walkway ratio and exposed gaps to transit");
+    expect(source).toContain("See covered-walkway ratio, exposed gaps, and night lighting near transit");
+    expect(source).not.toContain("See covered-walkway ratio and exposed gaps to transit");
     expect(source).not.toContain("Shelter-first walks to transit");
     expect(source).toContain('placeholder="Search OneMap address or 6-digit postal"');
     expect(source).toContain('aria-label="Search OneMap address or 6-digit postal"');
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  15:18:17
   Duration  493ms (transform 77ms, setup 0ms, import 95ms, tests 38ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The first-view subtitle named the covered-walkway ratio and exposed gaps, but omitted the night-lighting layer even though night lighting is the settled second evidence layer.

## DISAGREEMENTS

1. None.
