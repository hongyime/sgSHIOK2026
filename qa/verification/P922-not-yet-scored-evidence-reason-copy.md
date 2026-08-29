# P922 Not-Yet-Scored Evidence Reason Copy

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change was performed.

## Command Output

### Root And Host

```text
C:\sgSHIOK2026
Prawn-E14
43f315b7036de7f48d4077a1315783ed15fde520
43f315b7036de7f48d4077a1315783ed15fde520	refs/heads/main
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
   Start at  16:36:59
   Duration  8.76s (transform 2.76s, setup 0ms, import 3.54s, tests 2.51s, environment 1ms)
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

1. The `NOT_YET_SCORED` reason chip still said `Partial shelter-map evidence may be available`; that phrasing was cautious, but it implied a partial-evidence category rather than the simpler published-data fact that some walk evidence may still be inspectable.

## DISAGREEMENTS

1. None.
