# P898 Access reason stop-or-exit copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

Access low/high reason copy now says `Longer walk to stop or exit` and `Short walk to stop or exit` instead of `walk to transit`.

## Commands

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  14:50:13
   Duration  1.13s (transform 223ms, setup 0ms, import 271ms, tests 170ms, environment 1ms)
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

1. Access reason copy still said `walk to transit` after the first-view, row label, and all-transit details had moved to stop-or-exit vocabulary. P898 aligns the low/high descriptors without changing scoring behavior.

## DISAGREEMENTS

1. None.
