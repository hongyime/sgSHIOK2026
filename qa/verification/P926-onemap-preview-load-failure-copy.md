# P926 OneMap Preview Load-Failure Copy

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, dependency install, deployment, or locked-weight change was performed.

## Command Output

### Root And Host

```text
C:\sgSHIOK2026
Prawn-E14
dab40d751c6c34f32e6f4de999151d7ebc1cd927
dab40d751c6c34f32e6f4de999151d7ebc1cd927	refs/heads/main
```

### git check-ignore

```text
exit_code=1
```

### npm --prefix C:\sgSHIOK2026\web test -- accessibility-render.test.tsx route-evidence-map-interaction.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  52 passed (52)
   Start at  16:51:26
   Duration  7.68s (transform 2.53s, setup 0ms, import 2.96s, tests 1.79s, environment 2ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
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

1. Live OneMap preview failure copy said the preview was `unavailable`, which could read as a published-data absence rather than a live lookup failure.

## DISAGREEMENTS

1. None.
