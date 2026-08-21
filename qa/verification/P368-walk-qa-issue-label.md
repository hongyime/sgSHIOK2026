# P368 walk QA issue label

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
index 31dd8fe..180528a 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -858,7 +858,7 @@ function buildFeedbackPayload({
     transit_mode: transitMode,
     walk_mode: routeMode,
     route_mode: routeMode,
-    issue: "user_reported_better_walk_route",
+    issue: "user_reported_better_walk",
     source: "user_drawn_qa_evidence_not_score_override",
     waypoints: points.map((point) => [point.lat, point.lng]),
     segment_labels: segmentLabels.slice(0, Math.max(0, points.length - 1)),
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index f4d5bd5..d4c342f 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -106,6 +106,8 @@ describe("score card copy", () => {
     expect(source).toContain("Copy walk QA JSON");
     expect(source).toContain("walk_mode: routeMode");
     expect(source).toContain("route_mode: routeMode");
+    expect(source).toContain('issue: "user_reported_better_walk"');
+    expect(source).not.toContain('issue: "user_reported_better_walk_route"');
     const smokeSource = readFileSync(join(__dirname, "../../scripts/browser-smoke.mjs"), "utf-8");
     expect(smokeSource).toContain("shelter_map_panel_loaded");
     expect(smokeSource).toContain("shelter_map_panel_excerpt");
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  15:10:59
   Duration  549ms (transform 81ms, setup 0ms, import 100ms, tests 42ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The copied walk QA JSON still used a route-framed issue label, `user_reported_better_walk_route`, even though the user-facing action is `Copy walk QA JSON`.
2. Historical QA GeoJSON evidence under `qa/` still contains the old issue label; those files are evidence and were intentionally not modified.

## DISAGREEMENTS

1. None.
