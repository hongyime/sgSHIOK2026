# P213 Walk-comparison Covered-walkway Ratio

Date: 2026-08-21

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
ecdfd54fe6428ca6805dd8a0a087bb8b9e99fc34
ecdfd54fe6428ca6805dd8a0a087bb8b9e99fc34	refs/heads/main
```

## Scope

```text
Browser copy only.
No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, or locked-weight change.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  04:34:33
   Duration  6.57s (transform 2.94s, setup 0ms, import 3.79s, tests 1.49s, environment 2ms)
```

## Evidence Ignore Check

```text
exit=1
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## Locked Weights Diff Check

```text
exit=0
```

## FINDINGS

1. The walk comparison sentence still described the alternate walk as `% sheltered`, while the first-view and loaded summary now name covered-walkway ratio.
2. The helper comment also described the comparison as shelter coverage rather than covered-walkway ratio.
3. The change keeps the same selected/alternate percentages and threshold behavior; only the browser copy changes.

## DISAGREEMENTS

1. None.
