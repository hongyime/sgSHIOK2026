# P168 Locked-Score Sort Copy

## Scope

Browser copy/test-only change: keep the locked score available as a sorting index while telling users to start with the shelter trace and exposed gaps.

## Command Output

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  00:27:44
   Duration  10.83s (transform 5.29s, setup 0ms, import 7.07s, tests 1.96s, environment 4ms)
```

```text
python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0
```

```text
git diff -- pipeline/config/weights.yaml
```

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

## Findings

1. The locked-score row still said to use the locked score first and then inspect the shelter trace and exposed gaps.
2. The planning-area comparison still described the default view as order by locked score without restating that shelter evidence is primary.

## Disagreements

1. The P18 landed premise in the standing objective file still does not match the repository state observed at the start of this turn; this work continues against the actual `origin/main`.
