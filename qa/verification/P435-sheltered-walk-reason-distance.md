# P435 Sheltered Walk Reason Distance

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

No scoring, export, rescore, subset run, ingest, network build, deploy, or public data write was run.

## Scope

Free-tier browser copy change only:

- `web/app/page.tsx`
- `web/lib/__tests__/accessibility-render.test.tsx`
- `web/lib/__tests__/score-card-copy.test.ts`

The shelter-map evidence reason chip could say only `240 m to transit`. That distance is the published sheltered walk distance, so the chip now names it as the sheltered walk.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 139b6a5..14c376b 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -791,7 +791,7 @@ function scoreReasons(score: ScoreRecord, transitMode: TransitAccessMode): strin
   const measuredReasons: string[] = [];
   const busFallback = directBusFallbackEvidence(score);
   if (typeof score.paths.sheltered_m === "number") {
-    measuredReasons.push(`${formatDistance(score.paths.sheltered_m)} to ${transitModeLabel(transitMode)}`);
+    measuredReasons.push(`${formatDistance(score.paths.sheltered_m)} sheltered walk to ${transitModeLabel(transitMode)}`);
   }
   if (typeof score.paths.covered_ratio === "number") {
     measuredReasons.push(`${Math.round(score.paths.covered_ratio * 100)}% covered-walkway ratio on sheltered walk`);
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 32d8313..3dfaeaf 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -462,7 +462,9 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("Shelter exposure");
     expect(html).toContain("Walk to transit");
     expect(html).toContain("Sheltered walk distance to transit.");
+    expect(html).toContain("240 m sheltered walk to transit");
     expect(html).not.toContain("Selected walk distance to transit.");
+    expect(html).not.toContain("240 m to transit");
     expect(html).not.toContain("Selected route distance to transit.");
     expect(html).toContain("Bus service support");
     expect(html).toContain("Locked SHIOK score");
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 30baff0..43042b7 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -235,6 +235,8 @@ describe("score card copy", () => {
     expect(source).toContain("Night lighting");
     expect(source).toContain("Exposed gaps on {selectedWalkLabel}");
     expect(source).not.toContain("Exposed gaps on this walk");
+    expect(source).toContain("${formatDistance(score.paths.sheltered_m)} sheltered walk to ${transitModeLabel(transitMode)}");
+    expect(source).not.toContain("${formatDistance(score.paths.sheltered_m)} to ${transitModeLabel(transitMode)}");
     expect(source).toContain("include map coordinates.");
     expect(source).toContain(
       "Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score."
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  21:07:36
   Duration  2.15s (transform 1.19s, setup 0ms, import 1.53s, tests 444ms, environment 1ms)
```

```text
repo_integrity=ok
EXIT=0
```

```text
EXIT=0
```

Protected diff guard output above is empty except for `EXIT=0`.

```text
EXIT=1
```

`git check-ignore -v qa/verification/P435-sheltered-walk-reason-distance.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. A shelter-map evidence reason chip still reported only a distance to transit, without naming that it was the sheltered-walk distance.

## DISAGREEMENTS

1. None.
