# P870 Availability Range Copy

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
ad4213530c197dfafab7ca6a639f7b41adcd2dff
ad4213530c197dfafab7ca6a639f7b41adcd2dff	refs/heads/main
```

## Change

The first-card locked-score availability disclosure now says `beyond the 1.2 km locked transit range` instead of `beyond locked transit range`, so the count of `NO_TRANSIT_IN_RANGE` records is self-contained without hiding the locked scoring rule.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  72 passed (72)
   Start at  12:50:08
   Duration  5.88s (transform 982ms, setup 0ms, import 1.32s, tests 2.86s, environment 1ms)
```

## Diff Check

```text
exit_code=0
```

## Protected Path Guard

```text
exit_code=1
```

`rg` returned 1 because no protected modified paths matched.

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Diff Stat Before Commit

```text
 web/lib/__tests__/data.test.ts                      | 2 +-
 web/lib/__tests__/locked-score-availability.test.ts | 4 ++--
 web/lib/locked-score-availability.ts                | 2 +-
 3 files changed, 4 insertions(+), 4 deletions(-)
 M web/lib/__tests__/data.test.ts
 M web/lib/__tests__/locked-score-availability.test.ts
 M web/lib/locked-score-availability.ts
?? qa/verification/P870-availability-range-copy.md
```

## FINDINGS

1. The locked-score availability disclosure named the `NO_TRANSIT_IN_RANGE` bucket as `beyond locked transit range` without telling the user the range is 1.2 km. It now includes the number in the same sentence.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
