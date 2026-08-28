# P777 Exposed-Gap Disclosure

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Kept the three longest exposed gaps as the default scan surface and added a compact disclosure for shorter recorded gaps. This makes every exposed-gap record inspectable from the card without changing route geometry, score values, exports, public-data payloads, or locked weights.

## Commands

### npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  01:25:03
   Duration  16.13s (transform 5.21s, setup 0ms, import 6.62s, tests 4.07s, environment 2ms)
```

### npm --prefix web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  01:25:56
   Duration  37.24s (transform 2.41s, setup 0ms, import 4.62s, tests 14.52s, environment 12ms)
```

### uv run pytest -q --collect-only

```text
618 tests collected in 22.59s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### protected diff guard

```text
decisions.md                                    |  4 +++
web/app/page.module.css                         | 12 ++++++++
web/app/page.tsx                                | 39 +++++++++++++++++++++++++
web/lib/__tests__/accessibility-render.test.tsx |  2 ++
web/lib/__tests__/score-card-copy.test.ts       |  2 ++
5 files changed, 59 insertions(+)
```

## FINDINGS

1. The score card already computed and counted every exposed gap, but only rendered the three longest gap rows. Shorter gaps were hidden behind summary text, weakening the shelter-first inspection workflow.

## DISAGREEMENTS

1. None.
