# P666 unavailable evidence meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Live-region fallback now says `Shelter-map walk evidence unavailable` instead of `Walk evidence unavailable`.
- Shelter exposure unavailable metadata now says `Shelter-map walk unavailable`.
- Bus service unavailable metadata now says `Bus support unavailable`.

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
   Start at  13:11:11
   Duration  10.83s (transform 3.76s, setup 0ms, import 4.71s, tests 2.76s, environment 8ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:11:46
   Duration  32.73s (transform 2.20s, setup 0ms, import 4.14s, tests 11.81s, environment 11ms)
```

```text
457 tests collected in 16.26s
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

1. The old `Walk evidence unavailable` and `Bus evidence unavailable` fallbacks were broad labels in a panel that otherwise names shelter-map walks and bus service support precisely.
2. The replacements keep the unavailable state explicit while matching the user-facing row labels.

## DISAGREEMENTS

1. None.
