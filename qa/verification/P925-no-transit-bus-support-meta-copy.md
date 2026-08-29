# P925 No-Transit Bus-Support Meta Copy

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, dependency install, deployment, or locked-weight change was performed.

## Command Output

### Root And Host

```text
C:\sgSHIOK2026
Prawn-E14
92343e5b95894f3ec8ba6be24a4e502c223f26b5
92343e5b95894f3ec8ba6be24a4e502c223f26b5	refs/heads/main
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
   Start at  16:48:38
   Duration  4.53s (transform 1.43s, setup 0ms, import 1.85s, tests 1.16s, environment 1ms)
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

1. The no-transit fallback bus row still said `Bus service not scored`, which could sound like queued scoring rather than a locked-range computation boundary.

## DISAGREEMENTS

1. None.
