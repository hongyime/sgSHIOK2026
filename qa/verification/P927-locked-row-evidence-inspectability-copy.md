# P927 Locked-Row Evidence Inspectability Copy

## Scope

Free-tier browser copy/test/evidence work only.

No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, dependency install, deployment, or locked-weight change was performed.

## Command Output

### Root And Host

```text
C:\sgSHIOK2026
Prawn-E14
f8d94601f31cef8a7058b33f16091c59560e8801
f8d94601f31cef8a7058b33f16091c59560e8801	refs/heads/main
```

### git check-ignore

```text
exit_code=1
```

### npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts

First run exposed a stale P926 source assertion:

```text
 Test Files  1 failed (1)
      Tests  1 failed | 21 passed (22)
```

After updating that assertion:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  16:56:37
   Duration  935ms (transform 194ms, setup 0ms, import 230ms, tests 131ms, environment 0ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
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

1. The reason chip for records with shelter-map paths but unavailable locked-score rows said `Shelter-map evidence available`; `inspectable` better matches what the browser lets the user do with that evidence.
2. `score-card-copy.test.ts` still had one P926 assertion pinned to the old OneMap preview `unavailable for this selected...` substring even though the UI had already moved to `could not load`.

## DISAGREEMENTS

1. None.
