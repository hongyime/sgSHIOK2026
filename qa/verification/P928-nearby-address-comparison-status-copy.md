# P928 Nearby-Address Comparison Status Copy

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, dependency install, deployment, or locked-weight change was performed.

## Command Output

### Root And Host

```text
C:\sgSHIOK2026
Prawn-E14
ec89fe92d8c7aa3fa43713672fde9c132925ffbb
ec89fe92d8c7aa3fa43713672fde9c132925ffbb	refs/heads/main
```

### git check-ignore

```text
exit_code=1
```

### npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  17:00:37
   Duration  19.19s (transform 6.87s, setup 0ms, import 8.49s, tests 4.10s, environment 5ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

### git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml

```text
```

### python C:\sgSHIOK2026\scripts\check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. The comparison panel visibly said `Compare nearby addresses`, but status and empty messages still described `planning-area addresses`, making the same UI surface switch vocabulary mid-flow.

## DISAGREEMENTS

1. None.
