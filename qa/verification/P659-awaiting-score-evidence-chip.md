# P659 awaiting score evidence chip

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Not-yet-scored reason chips now say `Partial shelter-map evidence may be available` instead of `Awaiting locked score`.
- Browser smoke alignment was updated to accept the new user-facing reason chip.

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
   Start at  12:41:22
   Duration  9.37s (transform 3.34s, setup 0ms, import 4.14s, tests 2.29s, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:41:53
   Duration  35.86s (transform 2.15s, setup 0ms, import 4.21s, tests 12.43s, environment 11ms)
```

```text
457 tests collected in 16.89s
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

1. The old `Awaiting locked score` chip repeated the missing-score state without telling users why the record may still be worth inspecting.
2. The replacement keeps the missing full locked score explicit while pointing users back to the possible shelter-map evidence, using `may be available` to avoid promising paths on every unscored record.

## DISAGREEMENTS

1. None.
