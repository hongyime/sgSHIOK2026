# P872 No Walk Range Copy

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
90f50bb5d7371b90d28ed79705cb117e7d0a5934
90f50bb5d7371b90d28ed79705cb117e7d0a5934	refs/heads/main
```

## Change

No-transit fallback labels now include the 1.2 km cutoff where they previously said only `within range` or `within locked transit range`.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:56:02
   Duration  6.63s (transform 1.84s, setup 0ms, import 3.15s, tests 1.66s, environment 1ms)
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
 web/lib/__tests__/score-card-copy.test.ts       | 7 +++++--
 3 files changed, 11 insertions(+), 6 deletions(-)
 M web/app/page.tsx
 M web/lib/__tests__/accessibility-render.test.tsx
 M web/lib/__tests__/score-card-copy.test.ts
?? qa/verification/P872-no-walk-range-copy.md
```

## FINDINGS

1. No-transit fallback labels still used bare `within range` and `within locked transit range`, requiring the user to infer the 1.2 km cutoff from nearby copy. The labels now name the cutoff directly.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, public-data write, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
