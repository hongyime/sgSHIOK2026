# P159 Night-Lighting Route Detail

## Scope

Browser copy/test-only change: surface night lighting as a route-detail cue in the selected shelter-map panel while keeping it explicitly outside the locked score.

## Command Output

```text
npm --prefix web test -- web/lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  23:53:38
   Duration  2.33s (transform 328ms, setup 0ms, import 405ms, tests 118ms, environment 1ms)
```

```text
npm --prefix web test -- lib/__tests__/route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  23:53:38
   Duration  3.49s (transform 1.33s, setup 0ms, import 345ms, tests 1.25s, environment 1ms)
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

1. Night lighting was visible in the empty prompt, layer toggle, and map summary, but not in the selected shelter-map panel route-details strip.
2. The route-detail cue can point to the map layer without claiming a lighting score or mutating lamp artifacts.

## Disagreements

1. None.
