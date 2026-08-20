# P173 Walk-Feedback Actions

## Scope

Browser copy/test-only change: rename the traced correction menu actions from route/QA-generic wording to walk-feedback wording.

## Command Output

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  27 passed (27)
   Start at  00:45:05
   Duration  2.91s (transform 1.38s, setup 0ms, import 1.81s, tests 485ms, environment 1ms)
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

1. The feedback menu still said `Suggest better route`, despite the selected-walk product frame.
2. The copy action still said `Copy QA JSON`; the payload remains QA JSON, but the browser action now states that it is walk QA.

## Disagreements

1. The standing objective's P18 landed premise still does not match current `origin/main`; this work continues from the authoritative current tree.
