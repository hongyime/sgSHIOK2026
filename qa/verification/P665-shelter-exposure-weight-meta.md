# P665 shelter exposure weight meta

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- Shelter exposure scored metadata now says `40% locked shelter exposure` instead of `40% locked rain+heat`.

## Command Output

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/accessibility-render.test.tsx (39 tests | 1 failed) 4599ms
     × renders the route exposure lead and four-row score presentation 554ms

AssertionError: expected '<section class="_scoreCard_00c8fe" ar…' to contain '40% locked shelter exposure'

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 54 passed (55)
   Start at  13:05:19
   Duration  21.05s (transform 7.06s, setup 0ms, import 9.01s, tests 5.20s, environment 22ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  13:06:26
   Duration  5.78s (transform 1.71s, setup 0ms, import 2.19s, tests 1.56s, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:06:52
   Duration  33.73s (transform 2.15s, setup 0ms, import 4.23s, tests 11.34s, environment 13ms)
```

```text
457 tests collected in 14.45s
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

1. The shelter exposure row still exposed the internal rain-plus-heat score construction in its weighted metadata.
2. The replacement keeps the locked 40% contribution visible while matching the settled user-facing shelter exposure row.
3. The first focused test added an over-broad rendered assertion; that failure confirmed path-backed shelter rows still correctly show `Covered-walkway ratio` instead of the fallback locked-weight metadata.

## DISAGREEMENTS

1. None.
