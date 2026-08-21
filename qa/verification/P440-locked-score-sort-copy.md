# P440 locked score sort copy

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
2767f0f65481f10003cb3d8cdc87b750f67ff58a
2767f0f docs: update agent state after P439
dc86c86 fix: clarify OpenStreetMap source role
07f2994 docs: update agent state after P438
```

## Change

The planning-area comparison panel now describes the locked score as a sorting index, not a primary leaderboard:

```text
Planning-area list uses locked score only as a sorting index; shelter evidence remains the primary view.
```

## Diff stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 5 ++++-
 web/lib/__tests__/score-card-copy.test.ts       | 5 ++++-
 3 files changed, 9 insertions(+), 3 deletions(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  21:29:55
   Duration  1.98s (transform 747ms, setup 0ms, import 1.06s, tests 380ms, environment 1ms)
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

1. The previous comparison-panel sentence said the list was "sorted by locked score", which was accurate but still read like a score leaderboard.
2. The revised sentence keeps the ranking function visible while explicitly limiting the locked score to a sorting-index role.
3. This supports the settled product framing: shelter evidence is primary, the locked composite remains visible and secondary.

## DISAGREEMENTS

1. None.
