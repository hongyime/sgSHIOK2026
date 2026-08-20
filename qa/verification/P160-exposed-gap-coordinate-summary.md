# P160 Exposed-Gap Coordinate Summary

## Scope

Browser copy/test-only change: make the selected shelter-map panel explicitly say that exposed gaps are coordinate-backed map evidence.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  23:56:29
   Duration  2.14s (transform 853ms, setup 0ms, import 1.15s, tests 221ms, environment 0ms)
```

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  23:56:29
   Duration  955ms (transform 115ms, setup 0ms, import 147ms, tests 47ms, environment 0ms)
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

1. The selected panel listed per-gap coordinates, but the gap section title and summary did not state that the exposed-gap artifact is coordinate-backed.
2. The change is display copy only; it does not mutate geometry, exposure gaps, scores, public data, exports, or locked weights.

## Disagreements

1. None.
