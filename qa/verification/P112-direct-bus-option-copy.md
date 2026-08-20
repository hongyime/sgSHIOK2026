# P112 Direct-Bus Option Copy

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public data write, deployment, or locked weight change.

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Check Ignore

```text
exit=1
```

## Change

The direct-bus fallback note now says `direct bus options` instead of `direct bus candidates`.

## Diff Summary

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 2469cbc..1280b13 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -381,8 +381,8 @@ function directBusFallbackEvidence(score: ScoreRecord): DirectBusFallbackEvidenc
 function busFallbackSummary(evidence: DirectBusFallbackEvidence): string {
   const countText =
     evidence.candidateCount !== null
-      ? `${evidence.candidateCount} direct bus candidate${evidence.candidateCount === 1 ? "" : "s"}`
-      : "Direct bus candidates";
+      ? `${evidence.candidateCount} direct bus option${evidence.candidateCount === 1 ? "" : "s"}`
+      : "Direct bus options";
   const distanceText =
     evidence.nearestDirectM !== null ? `; nearest ${formatDistance(evidence.nearestDirectM)}` : "";
   const waitText = `${evidence.bestExpectedWaitMin.toFixed(1)} min best scheduled wait`;
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index a249638..377231c 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -429,7 +429,8 @@ describe("rendered accessibility output", () => {
 
     expect(html).toContain("Nearby bus evidence not route-verified");
     expect(html).toContain("62% sheltered on sheltered route");
-    expect(html).toContain("3 direct bus candidates found; nearest 99 m; 0.4 min best scheduled wait.");
+    expect(html).toContain("3 direct bus options found; nearest 99 m; 0.4 min best scheduled wait.");
+    expect(html).not.toContain("direct bus candidates found");
     expect(html).toContain("Walking network access was not verified, so this sub-score remains 0.");
     expect(html).toContain("Locked score caveat: the bus term remains 0");
     expect(html).toContain("Bus service support");
```

## Stale Phrase Search

```text
web/lib/__tests__/accessibility-render.test.tsx:433:    expect(html).not.toContain("direct bus candidates found");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  21:00:12
   Duration  1.28s (transform 575ms, setup 0ms, import 755ms, tests 155ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:00:22
   Duration  5.53s (transform 3.22s, setup 0ms, import 5.18s, tests 7.46s, environment 11ms)
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

## Findings

1. Direct-bus fallback evidence still exposed the internal `candidate` term to users even though the browser already frames that state as route-not-verified bus evidence. P112 changes the rendered summary to direct bus options.

## Disagreements

1. None.
