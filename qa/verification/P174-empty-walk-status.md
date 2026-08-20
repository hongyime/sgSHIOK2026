# P174 Empty Walk Status

## Scope

Browser accessibility copy/test-only change: rename the empty score-card live status from route selected to walk selected.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  00:47:55
   Duration  2.10s (transform 841ms, setup 0ms, import 1.14s, tests 333ms, environment 0ms)
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

1. The no-selection score-card live region still said `No shelter map route selected.`
2. The visible empty-state copy already asked users to inspect sheltered walk evidence; only the hidden status needed alignment.

## Disagreements

1. The standing objective's P18 landed premise still does not match current `origin/main`; this work continues from the authoritative current tree.
