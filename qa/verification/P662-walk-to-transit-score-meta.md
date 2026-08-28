# P662 walk-to-transit score meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Unavailable walk-to-transit metadata now says `Walk-to-transit score unavailable` instead of `Access term unavailable`.

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
   Start at  12:51:57
   Duration  3.85s (transform 1.25s, setup 0ms, import 1.66s, tests 919ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:52:19
   Duration  73.22s (transform 5.34s, setup 0ms, import 9.47s, tests 20.29s, environment 32ms)
```

```text
457 tests collected in 19.03s
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

1. `Access term unavailable` remained visible in the score breakdown and used internal component language.
2. The replacement names the visible row, `Walk to transit`, and keeps the missing score input clear.

## DISAGREEMENTS

1. None.
