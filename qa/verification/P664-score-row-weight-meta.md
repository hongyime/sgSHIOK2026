# P664 score row weight meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Walk-to-transit scored metadata now says `35% locked walk-to-transit` instead of `35% locked access`.
- Bus service scored metadata now says `20% locked bus support` instead of `20% locked bus`.

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
   Start at  12:59:44
   Duration  6.64s (transform 2.13s, setup 0ms, import 2.75s, tests 1.76s, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:00:44
   Duration  51.85s (transform 3.41s, setup 0ms, import 5.77s, tests 22.36s, environment 12ms)
```

```text
457 tests collected in 28.09s
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

1. The scored row metadata still used internal component names (`access`, `bus`) where the visible rows say `Walk to transit` and `Bus service support`.
2. The replacement keeps the locked weight percentages visible without making users translate subscore names.

## DISAGREEMENTS

1. None.
