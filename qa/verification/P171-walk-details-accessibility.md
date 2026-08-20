# P171 Walk-Details Accessibility

## Scope

Browser accessibility copy/test-only change: rename the selected-walk detail strip from route details to walk details.

## Command Output

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  00:38:44
   Duration  8.47s (transform 3.60s, setup 0ms, import 5.20s, tests 1.72s, environment 13ms)
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

1. The selected detail strip carried shelter-specific details, but its accessible label was still `Route details`.
2. The shelter-first workflow now uses walk framing in the route toggle, reset control, live region, and this detail strip.

## Disagreements

1. The standing objective's P18 landed premise still does not match current `origin/main`; this work continues from the authoritative current tree.
