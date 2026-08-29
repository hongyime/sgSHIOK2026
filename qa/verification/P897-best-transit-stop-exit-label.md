# P897 Best-transit stop-or-exit label

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The default all-transit label now renders as `transit stop or exit` instead of abstract `transit`. Bus-only and MRT/LRT-only labels remain `bus stop` and `MRT/LRT exit`.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/accessibility-render.test.tsx (41 tests | 1 failed) 661ms
     × explains no-transit records when a connected walk exists only beyond the locked range 50ms

AssertionError: expected rendered output to contain "Closest connected shelter-map walk to transit is 1.5 km"

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 62 passed (63)
   Start at  14:47:23
   Duration  3.02s (transform 919ms, setup 0ms, import 1.19s, tests 791ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:47:49
   Duration  2.77s (transform 923ms, setup 0ms, import 1.19s, tests 722ms, environment 0ms)
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

1. The all-transit route details still rendered abstract `transit` after the first-view and row label had moved to stop-or-exit vocabulary. P897 changes the shared default label to `transit stop or exit`, while retaining the specific bus-stop and MRT/LRT-exit labels.
2. The first focused test run caught the stale beyond-range assertion; the test now pins `Closest connected shelter-map walk to transit stop or exit is 1.5 km`.

## DISAGREEMENTS

1. None.
