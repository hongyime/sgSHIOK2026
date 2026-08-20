# P164 Outside-Bundle Universe Caveat

## Scope

Browser copy/test-only change: avoid implying that an outside-bundle OneMap search result belongs to the frozen v1 address universe.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:10:52
   Duration  2.75s (transform 1.18s, setup 0ms, import 1.52s, tests 402ms, environment 0ms)
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

1. The outside-bundle panel said no route was published for the postal `in the frozen June 2020 address universe`, which can overstate membership when the current bundle has no score record for that OneMap result.
2. The corrected copy keeps the frozen-v1 limitation visible while avoiding a false inclusion claim.

## Disagreements

1. None.
