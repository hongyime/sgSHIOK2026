# P215 Footer Covered-Walkway Evidence

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
ae08da19e5441b6c0228fadf38a4ea2c8fa33e0c
ae08da19e5441b6c0228fadf38a4ea2c8fa33e0c	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              | 3 +++
 web/app/page.tsx                          | 2 +-
 web/lib/__tests__/score-card-copy.test.ts | 5 +++--
 3 files changed, 7 insertions(+), 3 deletions(-)
```

## Focused Web Copy Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  04:40:02
   Duration  1.57s (transform 230ms, setup 0ms, import 271ms, tests 91ms, environment 1ms)
```

## Evidence Ignore Check

```text
exit=1
```

## Locked Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The persistent footer still used generic shelter-map evidence wording after the first view, loaded card, walk comparison, and map empty summary had moved to covered-walkway ratio and exposure-gap language.
2. The footer is visible across app states, so generic wording weakened the repeated headline artifact and was worth correcting before broader product changes.
3. The change is browser copy and test coverage only; it does not alter route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
