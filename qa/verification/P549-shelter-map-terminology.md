# P549 Shelter-Map Terminology

Date: 2026-08-22
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
7aa1f05fe02c439adf5bb59937344f376d64a014
```

## Scope

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

Changed only user-facing browser copy/provenance text and tests:

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
diff --git a/web/lib/live-route-scoring.ts b/web/lib/live-route-scoring.ts
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
diff --git a/web/lib/__tests__/live-route-scoring.test.ts b/web/lib/__tests__/live-route-scoring.test.ts
diff --git a/web/lib/__tests__/route-evidence-map-interaction.test.ts b/web/lib/__tests__/route-evidence-map-interaction.test.ts
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  06:37:35
   Duration  1.55s (transform 751ms, setup 0ms, import 1.01s, tests 344ms, environment 0ms)
```

## Full Web Test, First Run

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (10 tests | 1 failed) 1490ms
     × keeps arbitrary clicked OneMap routes preview-only and resettable 149ms

 Test Files  1 failed | 22 passed (23)
      Tests  1 failed | 149 passed (150)
   Start at  06:38:08
   Duration  9.15s (transform 5.23s, setup 0ms, import 8.18s, tests 13.41s, environment 15ms)
```

Cause: `route-evidence-map-interaction.test.ts` also pinned the old unhyphenated preview copy.

## Expanded Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts C:\sgSHIOK2026\web\lib\__tests__\live-route-scoring.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  58 passed (58)
   Start at  06:39:20
   Duration  1.85s (transform 1.50s, setup 0ms, import 2.00s, tests 946ms, environment 2ms)
```

## Full Web Test, Fixed

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:39:57
   Duration  5.66s (transform 4.15s, setup 0ms, import 5.43s, tests 7.36s, environment 10ms)
```

## Python Collect-Only

```text
437 tests collected in 10.29s
```

## Repo Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Check Ignore

```text
check_ignore_exit=1
```

## Protected Diff

```text
```

## Findings

1. A few visible/announced copy paths still used unhyphenated `shelter map` as an adjective: no-selection walk copy and live OneMap preview evidence/provenance copy.
2. The patch changes those adjective uses to `shelter-map`, while leaving structural labels such as `Shelter map panel` and `Shelter map evidence preview` unchanged.
3. This was a terminology consistency change at zero pipeline cost.

## Disagreements

1. None.
