# P661 locked score unavailable meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Unavailable locked-score metadata now says `Locked score unavailable` instead of `Release sorting index unavailable`.
- The scored locked-score row still says `Release sorting index`, preserving the settled secondary role of the composite when a score exists.

## Command Output

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  12:48:54
   Duration  7.10s (transform 2.19s, setup 0ms, import 2.82s, tests 1.82s, environment 2ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:49:21
   Duration  28.92s (transform 1.87s, setup 0ms, import 3.79s, tests 9.67s, environment 9ms)
```

```text
457 tests collected in 14.67s
```

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
exit=0
```

## FINDINGS

1. `Release sorting index unavailable` was visible on no-full-score rows and read like a release implementation detail rather than a direct user-facing status.
2. The replacement keeps the available-score role intact while making unavailable rows match the missing locked-score state.

## DISAGREEMENTS

1. None.
