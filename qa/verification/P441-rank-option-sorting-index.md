# P441 rank option sorting index

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
be69c79bb008791649f18e00a230aa96d59858d4
be69c79 docs: update agent state after P440
b68aef4 fix: clarify locked score sorting role
2767f0f docs: update agent state after P439
```

## Change

The planning-area comparison selector's overall option now says:

```text
Locked score sorting index
```

The score-card display row still says:

```text
Locked SHIOK score
```

## Diff stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 5 +++--
 web/lib/__tests__/score-card-copy.test.ts       | 7 +++++++
 web/lib/__tests__/subscore-ranking.test.ts      | 2 +-
 web/lib/subscore-ranking.ts                     | 2 +-
 5 files changed, 13 insertions(+), 5 deletions(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts subscore-ranking.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  46 passed (46)
   Start at  21:33:31
   Duration  5.23s (transform 2.83s, setup 0ms, import 4.28s, tests 1.62s, environment 2ms)
```

## Repo integrity

```text
repo_integrity=ok
EXIT=0
```

## Protected diff guard

```text
EXIT=0
```

## Evidence ignore check

```text
EXIT=1
```

## FINDINGS

1. The planning-area comparison selector still exposed the overall view as `Locked SHIOK score`, even after surrounding copy described it as a sorting index.
2. Renaming only the comparison option to `Locked score sorting index` makes the comparison control match the settled secondary-composite framing.
3. The score-card row label remains `Locked SHIOK score`, so the locked composite is still visible; this change only demotes the ranking control language.

## DISAGREEMENTS

1. None.
