# P162 Direct-Bus Fallback Shelter-Map Copy

## Scope

Browser copy/test-only change: direct-bus fallback caveats now name missing shelter-map route verification instead of generic walking-route access.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  00:02:55
   Duration  3.90s (transform 1.54s, setup 0ms, import 1.95s, tests 894ms, environment 2ms)
```

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  00:02:55
   Duration  1.40s (transform 243ms, setup 0ms, import 288ms, tests 69ms, environment 1ms)
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

1. Direct-bus fallback copy still said walking-route access/shelter was not verified, which was precise enough technically but no longer matched the shelter-map product frame.
2. The change preserves the settled behavior that direct bus service evidence does not promote the bus component without trusted route verification.

## Disagreements

1. None.
