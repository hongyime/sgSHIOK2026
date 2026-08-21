# P365 locked score unavailable copy

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
index 6bde907..d1bd95b 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -206,7 +206,7 @@ export function scoreCardAnnouncement({
     return `${postal} is outside the shelter-map bundle tied to the frozen June 2020 address universe; ${recentPublicSourceGapCopyForPostal(selection.result.POSTAL)}.`;
   }
   const scoreText = displayScore === null || displayScore === undefined
-    ? "no full locked score in this bundle"
+    ? "unavailable in this bundle"
     : `${Math.round(displayScore)} out of 100`;
   const stopText = isCustomStopSelected
     ? previewRoute
@@ -1281,7 +1281,7 @@ export function ScoreCard({
           id: "locked-score",
           label: "Locked SHIOK score",
           value: formatLockedScore(displayScore),
-          meta: scoredMeta(displayScore, "Release sorting index", "No full locked score"),
+          meta: scoredMeta(displayScore, "Release sorting index", "Release sorting index unavailable"),
           notes: [
             "Start with the shelter trace and exposed gaps; use the locked score only to sort the published shelter-map bundle.",
             "Crossing friction remains a 5% locked term, but has low separation in this release.",
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index e9ced03..b22f84d 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -578,13 +578,14 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("Locked score unavailable");
     expect(html).toContain("<strong>Unavailable</strong><small>Shelter evidence unavailable</small>");
     expect(html).toContain("<strong>Unavailable</strong><small>Access term unavailable</small>");
-    expect(html).toContain("<strong>No full locked score</strong><small>No full locked score</small>");
+    expect(html).toContain("<strong>No full locked score</strong><small>Release sorting index unavailable</small>");
     expect(html).toContain("<strong>42</strong><small>20% locked bus</small>");
     expect(html).not.toContain("<strong>0</strong><small>Shelter evidence unavailable</small>");
     expect(html).not.toContain("<strong>0</strong><small>Access term unavailable</small>");
     expect(html).not.toContain("<strong>Not scored</strong><small>No shelter score</small>");
     expect(html).not.toContain("<strong>Not scored</strong><small>No access score</small>");
     expect(html).not.toContain("<strong>Not scored</strong><small>No locked score</small>");
+    expect(html).not.toContain("<strong>No full locked score</strong><small>No full locked score</small>");
     expect(html).not.toContain("<strong>No full locked score</strong><small>No locked score</small>");
     expect(html).not.toContain("Score not available");
     expect(html).not.toContain("Bundle score unavailable");
@@ -614,7 +615,8 @@ describe("rendered accessibility output", () => {
     expect(html).toContain("No full locked score in this bundle");
     expect(html).toContain("Awaiting locked score");
     expect(html).not.toContain("Location Evidence Missing");
-    expect(html).toContain("Locked score no full locked score in this bundle.");
+    expect(html).toContain("Locked score unavailable in this bundle.");
+    expect(html).not.toContain("Locked score no full locked score in this bundle.");
     expect(html).not.toContain("No full score in this bundle");
     expect(html).toContain(
       "This postal is in the frozen v1 address universe, but this shelter-map bundle has no published full locked score for it yet."
```

## Verification commands

```text
npm --prefix web test -- --run lib/__tests__/accessibility-render.test.tsx
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  14:58:17
   Duration  3.02s (transform 1.28s, setup 0ms, import 1.70s, tests 351ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. Partial and not-yet-scored states still carried repetitive unavailable-score copy: the locked-score breakdown row rendered `No full locked score` as both the row value and the row metadata, and the live-region sentence read as `Locked score no full locked score in this bundle.`
2. The corrected copy preserves the missing full-score state while naming the missing capability: the release sorting index is unavailable.

## DISAGREEMENTS

1. None.
