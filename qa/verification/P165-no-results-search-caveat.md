# P165 No-Results Search Caveat

## Scope

Browser copy/test-only change: separate OneMap no-result feedback from the frozen shelter-map bundle coverage caveat.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:14:29
   Duration  10.00s (transform 4.08s, setup 0ms, import 5.13s, tests 2.24s, environment 3ms)
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

1. The no-results feedback joined OneMap lookup failure and frozen-bundle measured misses in one sentence, which could imply the bundle miss rate explains this specific lookup result.
2. The revised copy keeps both facts visible while separating their causes.

## Disagreements

1. None.
