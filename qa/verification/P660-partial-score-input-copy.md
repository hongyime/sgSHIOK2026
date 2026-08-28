# P660 partial score input copy

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Partial locked-score caveat now says unavailable score inputs count as zero in the locked formula instead of saying the formula counts unavailable terms as zero.

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
   Start at  12:44:37
   Duration  3.90s (transform 1.28s, setup 0ms, import 1.67s, tests 980ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:45:00
   Duration  79.96s (transform 5.86s, setup 0ms, import 10.42s, tests 25.07s, environment 30ms)
```

```text
457 tests collected in 26.46s
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

1. The old partial-score caveat still used `unavailable terms`, which leaks internal score-component language into a user-facing warning.
2. The replacement keeps the zero-counting caveat intact while aligning the wording with visible score inputs.

## DISAGREEMENTS

1. None.
