# P871 No Transit Range Label

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
0e52ce877ea2b5f8988251e78320386540a0cb3e
0e52ce877ea2b5f8988251e78320386540a0cb3e	refs/heads/main
```

## Change

Short no-transit reason and access-row labels now say `Beyond 1.2 km locked range` instead of `Outside locked transit range`. Longer explanatory sentences still spell out the locked 1.2 km transit rule.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx locked-score-availability.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  67 passed (67)
   Start at  12:52:54
   Duration  4.53s (transform 1.85s, setup 0ms, import 2.09s, tests 487ms, environment 0ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## Protected Path Guard

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
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
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                | 4 ++--
 web/lib/__tests__/accessibility-render.test.tsx | 6 ++++--
 web/lib/__tests__/score-card-copy.test.ts       | 3 ++-
 3 files changed, 8 insertions(+), 5 deletions(-)
 M web/app/page.tsx
 M web/lib/__tests__/accessibility-render.test.tsx
 M web/lib/__tests__/score-card-copy.test.ts
?? qa/verification/P871-no-transit-range-label.md
```

## FINDINGS

1. The short no-transit UI label `Outside locked transit range` did not carry the 1.2 km cutoff where the user sees the bucket label. It now says `Beyond 1.2 km locked range`.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
