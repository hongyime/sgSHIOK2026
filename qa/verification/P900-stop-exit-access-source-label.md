# P900 Stop/exit access source label

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The destination connector source label now says `Stop/exit access walk` instead of `Transit access walk`.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  41 passed (41)
   Start at  14:57:50
   Duration  4.44s (transform 1.61s, setup 0ms, import 2.06s, tests 1.36s, environment 1ms)
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
```

## FINDINGS

1. Shelter-source evidence still labelled destination connector segments as `Transit access walk`, which lagged the stop-or-exit vocabulary now used in the first view, access row, and route notes. P900 changes only the browser-facing label to `Stop/exit access walk`.

## DISAGREEMENTS

1. None.
