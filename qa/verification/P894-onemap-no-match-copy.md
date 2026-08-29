# P894 OneMap no-match copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change.

## Change

The search no-results state now says no OneMap match instead of no OneMap address result.

## Commands

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=7ac6bc8cbb012e383a56a815f3e220fa09f3b195
REMOTE=7ac6bc8cbb012e383a56a815f3e220fa09f3b195	refs/heads/main
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:35:47
   Duration  17.03s (transform 5.30s, setup 0ms, import 6.67s, tests 4.41s, environment 3ms)
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

1. The search empty-state still used implementation-shaped wording (`OneMap address result`) after the surrounding first-view copy had already moved to address-facing shelter-map language. P894 changes that state to `No OneMap match...` while retaining the 6-digit postal recovery action and the June 2020 address-list caveat.

## DISAGREEMENTS

1. None.
