# P895 Transit stop-or-exit first-view copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The first-view subtitle and empty score-card prompt now say the walk is to a transit stop or exit instead of abstract transit.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (11 tests | 1 failed) 209ms
     × uses sheltered walk copy in non-visual map summaries 45ms

AssertionError: expected source to contain "Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer."

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 73 passed (74)
   Start at  14:38:42
   Duration  7.30s (transform 1.93s, setup 0ms, import 2.51s, tests 1.76s, environment 2ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  14:39:29
   Duration  4.18s (transform 1.11s, setup 0ms, import 1.14s, tests 1.27s, environment 1ms)
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
```

## FINDINGS

1. The first-view copy still said `walk to transit` even though the rest of the browser now consistently names MRT/LRT exits and bus stops. P895 changes the subtitle, empty score-card prompt, and non-visual map summary to say `walk to a transit stop or exit`.
2. The first focused test run caught the non-visual map summary still carrying the old phrase; the companion string was updated before commit.

## DISAGREEMENTS

1. None.
