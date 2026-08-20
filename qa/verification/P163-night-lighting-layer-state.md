# P163 Night-Lighting Layer State

## Scope

Browser UI copy/state wiring only: show whether the LTA lamp-post night-lighting map layer is on or off in the selected shelter-map panel route details.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:07:17
   Duration  2.66s (transform 1.08s, setup 0ms, import 1.43s, tests 389ms, environment 0ms)
```

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  00:07:17
   Duration  1.14s (transform 155ms, setup 0ms, import 189ms, tests 52ms, environment 1ms)
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

1. The selected panel named night lighting as a map layer, but did not reflect whether that layer was currently enabled.
2. Passing the existing `lampOverlayEnabled` state into `ScoreCard` makes the route detail accurate without touching lamp artifacts or scoring.

## Disagreements

1. None.
