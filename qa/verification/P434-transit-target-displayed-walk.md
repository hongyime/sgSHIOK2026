# P434 Transit Target Displayed Walk

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

The transit target segmented control still described the `Best transit` option as `current walk`. The rest of the selected-walk panel now uses displayed-walk language, so the chip should name the displayed evidence instead of the vaguer current state.

## Diff

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
index efedf37..139b6a5 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -978,7 +978,7 @@ function TransitModeControl({
 }) {
   if (!score.route_options) return null;
   const availabilityLabel = (option: (typeof TRANSIT_MODE_OPTIONS)[number], available: boolean) => {
-    if (option.id === "best_transit") return available ? "current walk" : "unavailable";
+    if (option.id === "best_transit") return available ? "displayed walk" : "unavailable";
     if (available) return "published walk";
     return "no published walk";
   };
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
index 5e7d4d5..32d8313 100644
--- a/web/lib/__tests__/accessibility-render.test.tsx
+++ b/web/lib/__tests__/accessibility-render.test.tsx
@@ -683,10 +683,11 @@ describe("rendered accessibility output", () => {
     });
 
     expect(html).toContain('aria-label="Transit target"');
-    expect(html).toContain("<span>Best transit</span><small>current walk</small>");
+    expect(html).toContain("<span>Best transit</span><small>displayed walk</small>");
     expect(html).toContain("<span>MRT/LRT</span><small>no published walk</small>");
     expect(html).toContain("<span>Bus</span><small>published walk</small>");
     expect(html).not.toContain("<span>Best transit</span><small>selected walk</small>");
+    expect(html).not.toContain("<span>Best transit</span><small>current walk</small>");
     expect(html).not.toContain("<span>Best transit</span><small>selected route</small>");
     expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter-map walk</small>");
     expect(html).not.toContain("<span>Bus</span><small>shelter-map walk</small>");
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  41 passed (41)
   Start at  21:01:04
   Duration  8.22s (transform 3.62s, setup 0ms, import 5.21s, tests 2.97s, environment 1ms)
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

`git check-ignore -v qa/verification/P434-transit-target-displayed-walk.md` exited 1, so the evidence path is trackable.

## FINDINGS

1. The `Best transit` chip still used `current walk`, which was accurate but less specific than the displayed-walk copy now used by the score card.

## DISAGREEMENTS

1. None.
