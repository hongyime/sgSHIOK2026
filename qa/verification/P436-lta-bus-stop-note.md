# P436 LTA Bus Stop Note

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

The `Bus service support` note still used the source-system phrase `DataMall bus stop`. The user-facing claim is whether the published shelter-map walk could prove access to an official LTA bus stop, so the note now says that directly.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index 14c376b..4d8af0d 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1331,7 +1331,7 @@ export function ScoreCard({
           value: formatScore(score.subscores.bus),
           meta: scoredMeta(score.subscores.bus, "20% locked bus", "Bus evidence unavailable"),
           notes: [
-            "A low value can mean weak service evidence, or that routing could not prove a trusted walk to a DataMall bus stop.",
+            "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop.",
             busFallback
               ? `${busFallbackSummary(busFallback)} Shelter-map walk access was not verified, so the locked bus term remains 0.`
               : null,
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 3dfaeaf..a8b2248 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -467,6 +467,10 @@ describe("rendered accessibility output", () => {
     expect(html).not.toContain("240 m to transit");
     expect(html).not.toContain("Selected route distance to transit.");
     expect(html).toContain("Bus service support");
+    expect(html).toContain(
+      "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
+    );
+    expect(html).not.toContain("trusted walk to a DataMall bus stop");
     expect(html).toContain("Locked SHIOK score");
     expect(html).toContain('aria-label="Planning-area comparison"');
     expect(html).toContain("Compare planning-area records");
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 43042b7..6f5c225 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -440,6 +440,10 @@ describe("score card copy", () => {
     expect(source).toContain('label: "Shelter exposure"');
     expect(source).toContain('label: "Walk to transit"');
     expect(source).toContain('label: "Bus service support"');
+    expect(source).toContain(
+      "A low value can mean weak service evidence, or that the published shelter-map walk could not prove access to an official LTA bus stop."
+    );
+    expect(source).not.toContain("trusted walk to a DataMall bus stop");
     expect(source).toContain('bus: { low: "Limited bus-service evidence", high: "Stronger bus-service evidence" }');
     expect(source).not.toContain("Limited bus connectivity");
     expect(source).not.toContain("Strong bus connectivity");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  21:11:47
   Duration  4.50s (transform 1.84s, setup 0ms, import 2.69s, tests 982ms, environment 2ms)
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

`git check-ignore -v qa/verification/P436-lta-bus-stop-note.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The `Bus service support` row still exposed the source-system phrase `DataMall bus stop` where user-facing copy should describe an official LTA bus stop and the published shelter-map walk proof boundary.

## DISAGREEMENTS

1. None.
