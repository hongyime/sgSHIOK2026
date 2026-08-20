# P166 Short-Query Search Guidance

## Scope

Browser copy/test-only change: clarify that short address strings use OneMap search, while 6-digit postal codes use direct postal lookup.

## Command Output

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  00:17:41
   Duration  1.93s (transform 359ms, setup 0ms, import 438ms, tests 80ms, environment 1ms)
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

1. The short-query validation copy treated address search and postal lookup as one generic input rule.
2. The revised copy names the OneMap search path and the direct 6-digit postal path separately.

## Disagreements

1. None.
