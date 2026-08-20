# P161 Locked-Score Reason Chips

## Scope

Browser copy/test-only change: align missing/incomplete reason chips with the locked-score terminology already used in the panel.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  23:59:20
   Duration  2.36s (transform 969ms, setup 0ms, import 1.28s, tests 326ms, environment 0ms)
```

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  23:59:20
   Duration  960ms (transform 129ms, setup 0ms, import 160ms, tests 52ms, environment 0ms)
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

1. Reason chips still used generic `Bundle score unavailable` / `Bundle score incomplete` text even though the UI now presents the number as the secondary locked score.
2. Published-bundle inclusion copy remains where it is specifically about whether a record or preview is part of the published bundle.

## Disagreements

1. None.
