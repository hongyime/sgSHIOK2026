# P121 Greenery Proxy Route Detail

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
git check-ignore -v qa/verification/P121-greenery-proxy-route-detail.md
exit=1
```

## Source Diff Before Evidence

```diff
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 2765ee6..6d37d25 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1135,7 +1135,7 @@ export function ScoreCard({
       : null;
   const routeDetailItems: Array<{ label: string; value: string }> = [];
   if (shadeProxyPct !== null) {
-    routeDetailItems.push({ label: "Shade proxy", value: `${shadeProxyPct}%` });
+    routeDetailItems.push({ label: "Greenery proxy", value: `${shadeProxyPct}%` });
   }
   if (endpointSnapM > 0) {
     routeDetailItems.push({ label: "Snap connector", value: formatDistance(endpointSnapM) });
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index febce61..8c947dc 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -126,7 +126,7 @@ describe("score card copy", () => {
     expect(source).toContain("className={styles.compareNote}");
   });
 
-  it("keeps shade proxy and snap connector in a subtle route-details strip, not a duplicate metric row", () => {
+  it("keeps greenery proxy and snap connector in a subtle route-details strip, not a duplicate metric row", () => {
     const cssSource = readFileSync(join(__dirname, "../../app/page.module.css"), "utf-8");
     const tsxSource = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
 
@@ -136,7 +136,8 @@ describe("score card copy", () => {
     expect(cssSource).not.toContain(".routeSecondary {");
     expect(cssSource).not.toContain(".routeTertiary {");
 
-    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Shade proxy\"");
+    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
+    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
     expect(tsxSource).toContain("routeDetailItems.push({ label: \"Snap connector\"");
     expect(tsxSource).toContain(
       "Snap connector is the short link from the postal or transit point onto mapped walking-route evidence."
```

## Search

```text
web/app/page.tsx:1138:    routeDetailItems.push({ label: "Greenery proxy", value: `${shadeProxyPct}%` });
web/lib/__tests__/score-card-copy.test.ts:139:    expect(tsxSource).toContain("routeDetailItems.push({ label: \"Greenery proxy\"");
web/lib/__tests__/score-card-copy.test.ts:140:    expect(tsxSource).not.toContain("routeDetailItems.push({ label: \"Shade proxy\"");
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deployment, public data mutation, protected QA mutation, or weights.yaml edit was performed.
```

## Validation

```text
npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:33:01
   Duration  1.37s (transform 163ms, setup 0ms, import 211ms, tests 65ms, environment 1ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:33:14
   Duration  9.22s (transform 6.84s, setup 0ms, import 9.59s, tests 11.31s, environment 15ms)

git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0

git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0

python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. The route-detail strip still used `Shade proxy` for the sparse NParks helper value after the rest of the product copy had moved toward more cautious greenery/evidence language.

## DISAGREEMENTS

1. None.
