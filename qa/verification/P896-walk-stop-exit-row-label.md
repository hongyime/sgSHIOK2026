# P896 Walk to stop-or-exit row label

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The access display row now says `Walk to stop or exit` instead of `Walk to transit`. The locked scoring-term meta still says `35% locked walk-to-transit`.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:43:19
   Duration  8.74s (transform 2.86s, setup 0ms, import 3.45s, tests 2.73s, environment 2ms)
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

1. The four-row presentation still used the abstract label `Walk to transit` after the first-view promise had moved to `transit stop or exit`. P896 changes the user-facing row label while preserving the scoring-term meta `35% locked walk-to-transit`.

## DISAGREEMENTS

1. None.
