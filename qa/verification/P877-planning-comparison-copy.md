# P877 Planning Comparison Copy

## Guard

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Protected operations: no scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, public-data write, or protected evidence/data mutation.
```

## Change

```text
Changed planning-area panel copy from rank-first wording to comparison-first wording:
- Show ranks -> Show comparison
- Loads planning-area ranks only when opened. -> Loads planning-area comparison only when opened.
- Loading/no-result status for metric views now says comparison instead of ranks.
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx lib/__tests__/subscore-ranking.test.ts lib/__tests__/rank-payload.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  4 passed (4)
      Tests  69 passed (69)
   Start at  13:23:56
   Duration  14.56s (transform 3.76s, setup 0ms, import 5.27s, tests 3.49s, environment 3ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. The panel header already says `Compare planning-area records`, but its closed button and live-status copy still said `ranks`, making the secondary locked-score ordering feel like the product headline.
2. The numeric ordering remains visible in the opened list; this changes copy only, not ranking logic.

## DISAGREEMENTS

1. None.
