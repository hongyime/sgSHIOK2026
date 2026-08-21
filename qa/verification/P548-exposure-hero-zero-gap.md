# P548 Exposure Hero Zero-Gap Copy

Date: 2026-08-22
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
b6cdee01befc9a2e2dcbe818ffa6413d69193be8
```

## Scope

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

Changed only the browser exposure hero label and the rendered copy test:

```text
diff --git a/web/app/page.tsx b/web/app/page.tsx
diff --git a/web/lib/__tests__/accessibility-render.test.tsx b/web/lib/__tests__/accessibility-render.test.tsx
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  06:33:43
   Duration  5.13s (transform 2.54s, setup 0ms, import 3.44s, tests 1.45s, environment 2ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:34:28
   Duration  5.98s (transform 4.38s, setup 0ms, import 6.18s, tests 8.59s, environment 11ms)
```

## Python Collect-Only

```text
437 tests collected in 10.81s
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

1. The exposure hero previously used `Where the walk is exposed` even when a selected route had no recorded exposure gaps.
2. The new label keeps `Where the walk is exposed` for routes with gaps, but uses `Covered-walkway evidence` for zero-gap routes, avoiding an implied exposure list that does not exist.
3. The change is user-visible and free-tier: it touches only web copy/rendering and tests.

## Disagreements

1. None.
