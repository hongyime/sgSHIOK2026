# P901 Search button busy copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The first-view search submit button now says `Searching` while a lookup is running instead of generic `Loading`.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  15:02:52
   Duration  4.44s (transform 802ms, setup 0ms, import 884ms, tests 446ms, environment 1ms)
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
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

1. The primary search button used generic `Loading` while an address/postal lookup was running. P901 changes the busy state to `Searching`, matching the user's action.

## DISAGREEMENTS

1. None.
