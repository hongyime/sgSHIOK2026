# P663 locked transit range meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- The no-full-score walk row now says `Outside locked transit range` instead of `Outside locked access range`.

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
   Start at  12:56:02
   Duration  5.69s (transform 1.94s, setup 0ms, import 2.46s, tests 1.31s, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:56:26
   Duration  34.44s (transform 2.26s, setup 0ms, import 4.16s, tests 12.65s, environment 10ms)
```

```text
457 tests collected in 16.21s
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

1. `Outside locked access range` used internal access-score language for a user-facing row.
2. The actual rule shown elsewhere is the locked 1.2 km transit range, so the replacement names that boundary directly.

## DISAGREEMENTS

1. None.
