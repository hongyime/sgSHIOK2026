# P551 Night Lighting Off-State Copy

Date: 2026-08-22
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
552579b5f04b4aa078b1e4264376159c99309a5d
```

## Scope

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

Changed only selected-card night-lighting copy and tests:

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
diff --git a/web/lib/__tests__/score-card-copy.test.ts b/web/lib/__tests__/score-card-copy.test.ts
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  06:46:26
   Duration  1.71s (transform 895ms, setup 0ms, import 1.17s, tests 355ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:47:03
   Duration  6.84s (transform 3.56s, setup 0ms, import 5.10s, tests 9.69s, environment 9ms)
```

## Python Collect-Only

```text
437 tests collected in 10.77s
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

1. The selected walk details row reduced night lighting to `Map layer off` when disabled, which described only the toggle state and hid that lamp-post evidence is available as the second map layer.
2. The off-state now reads `Available; map layer off`, while the on-state remains `Map layer on; zoom in for lamp-post points`.
3. This is a user-visible copy-only change at zero pipeline cost.

## Disagreements

1. None.
