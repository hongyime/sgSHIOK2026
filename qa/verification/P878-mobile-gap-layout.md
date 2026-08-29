# P878 Mobile Gap Layout

## Guard

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Protected operations: no scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, public-data write, or protected evidence/data mutation.
```

## Change

```text
Added a max-width 560px CSS rule so exposed-gap rows use two columns on mobile and the map action can wrap below the description instead of occupying a third column beside coordinate text.
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  13:29:00
   Duration  7.90s (transform 2.29s, setup 0ms, import 2.92s, tests 2.04s, environment 1ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. Exposed-gap rows are the primary inspectable artifact, but the mobile CSS still forced distance, description, coordinate, and action text into a three-column layout.
2. This change affects responsive layout only; the exposed-gap data, action labels, and map focus behavior are unchanged.

## DISAGREEMENTS

1. None.
