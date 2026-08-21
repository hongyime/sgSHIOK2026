# P442 locked score coverage line

## Working root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Base

```text
d3e3698eb4e585e4704efff407dead17f46a3b96
d3e3698 docs: update agent state after P441
90cbb48 fix: label locked score rank option as sorting index
be69c79 docs: update agent state after P440
```

## Change

The first-view locked-score disclosure now starts with bundle coverage and names the secondary score as a sorting index:

```text
Locked score coverage: 95,157 of 124,443 records have a full locked sorting index; 29,286 records (23.5%, roughly a quarter) do not show a full locked score: 18,983 with partial shelter-map evidence, 9,827 beyond locked transit range, and 476 awaiting scoring.
```

## Diff stat

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/lib/__tests__/data.test.ts                      | 2 +-
 web/lib/__tests__/locked-score-availability.test.ts | 6 +++---
 web/lib/__tests__/score-card-copy.test.ts           | 5 ++++-
 web/lib/locked-score-availability.ts                | 4 ++--
 4 files changed, 10 insertions(+), 7 deletions(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts score-card-copy.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  23 passed (23)
   Start at  21:37:28
   Duration  1.19s (transform 331ms, setup 0ms, import 521ms, tests 508ms, environment 1ms)
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

1. The previous first-view disclosure started with `Locked score availability`, which was accurate but still framed the line around the score.
2. The revised line reports bundle coverage first and calls the full locked score a sorting index, matching the settled product framing.
3. The roughly-quarter missing-score disclosure remains visible and exact: 29,286 of 124,443 records, 23.5%.

## DISAGREEMENTS

1. None.
