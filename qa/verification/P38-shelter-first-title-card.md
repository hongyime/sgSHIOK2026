# P38 Shelter-First Title Card

## Startup Guard

```powershell
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
99259761ff9563fbd917a5e4ff533747e9f88b7f
99259761ff9563fbd917a5e4ff533747e9f88b7f	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence Path

```powershell
EXIT=1
```

## Focused Diff

```diff
diff --git a/.agents/STATE.md b/.agents/STATE.md
index 7f7dcd9..7ceb7df 100644
--- a/.agents/STATE.md
+++ b/.agents/STATE.md
@@ -2,14 +2,15 @@
 
 Date: 2026-08-16
 
-Task: P37 missing postal score copy is implemented and ready to hand back.
+Task: P38 shelter-first title-card copy is implemented and ready to hand back.
 
 Working root: `C:\sgSHIOK2026`
 Machine: `Prawn-E14`
-Remote main: `0865fb6` at P37 task start.
+Remote main: `9925976` at P38 task start.
 
 Status:
 - Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
+- P38 aligns the title-card subtitle with the settled shelter-first framing, changing the old generic `Singapore walk-to-transit comfort` copy to `Shelter-first walks to transit`. Evidence is tracked at `qa/verification/P38-shelter-first-title-card.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P37 changes the no-score detail card to say no route evidence is published for that postal in the frozen June 2020 address universe, instead of only `Not yet scored`. Evidence is tracked at `qa/verification/P37-missing-postal-score-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P36 clarifies the title-card freshness copy: route evidence has the bundle date, while the address universe is frozen v1 from a June 2020 OneMap-derived postal scrape. Evidence is tracked at `qa/verification/P36-frozen-universe-copy.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
 - P35 adds the active exposed-gap coordinate to the route map's non-visual summary so the selected map marker is available to screen-reader users. Evidence is tracked at `qa/verification/P35-selected-gap-map-summary.md`. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
diff --git a/decisions.md b/decisions.md
index 5a94a13..f28de9f 100644
--- a/decisions.md
+++ b/decisions.md
@@ -104,3 +104,6 @@ The title card should not imply that the address universe is current merely beca
 
 2026-08-16 - P37 missing postal score copy:
 When a searched postal has no score record, the detail card should explain that no route evidence is published for that postal in the frozen June 2020 address universe, rather than only saying `not yet scored`. This keeps the local failure state aligned with the title-card caveat. It changes only browser copy and render tests; it does not alter search, scoring, exports, inputs, public data, or locked weights.
+
+2026-08-16 - P38 shelter-first title card:
+The title-card subtitle should match the settled product framing that route shelter evidence leads and the locked composite is secondary. The visible subtitle is now `Shelter-first walks to transit` instead of the older generic `Singapore walk-to-transit comfort`. This is a browser copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.
diff --git a/web/app/page.tsx b/web/app/page.tsx
index c7a2d47..5138f94 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -1880,7 +1880,7 @@ export default function Home() {
         <div className={styles.brandRow}>
           <div>
             <h1>S.H.I.O.K. Index</h1>
-            <p>Singapore walk-to-transit comfort</p>
+            <p>Shelter-first walks to transit</p>
             <p className={styles.dataLine}>Route evidence as of {formatDataDate(manifest)}</p>
             <p className={styles.freshnessLine}>
               Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; newer completions may be missing.
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
index 9fe6719..83fe29d 100644
--- a/web/lib/__tests__/score-card-copy.test.ts
+++ b/web/lib/__tests__/score-card-copy.test.ts
@@ -25,6 +25,8 @@ describe("score card copy", () => {
     const source = readFileSync(join(__dirname, "../../app/page.tsx"), "utf-8");
     const layoutSource = readFileSync(join(__dirname, "../../app/layout.tsx"), "utf-8");
 
+    expect(source).toContain("Shelter-first walks to transit");
+    expect(source).not.toContain("Singapore walk-to-transit comfort");
     expect(source).toContain("Route evidence as of {formatDataDate(manifest)}");
     expect(source).toContain(
       "Address universe: frozen v1 from a June 2020 OneMap-derived postal scrape; newer completions may be missing."
```

## Focused Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  12:53:38
   Duration  515ms (transform 46ms, setup 0ms, import 63ms, tests 20ms, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts
```

## TypeScript

```powershell
```

## Full Web Test

```powershell
 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  118 passed (118)
   Start at  12:53:55
   Duration  8.20s (transform 6.85s, setup 0ms, import 7.97s, tests 9.89s, environment 21ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

## Repository Integrity

```powershell
repo_integrity=ok
EXIT=0
```

## Weights Diff

```powershell
EXIT=0
```

## Scope

No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or `pipeline/config/weights.yaml` change was run.

## FINDINGS

1. The first-viewport title-card subtitle still used the older generic copy `Singapore walk-to-transit comfort` after the rest of the page had moved to the shelter-first product framing.
2. The change is copy-only in the browser title card and is covered by a source-copy test that rejects the old generic subtitle.

## DISAGREEMENTS

1. None.
