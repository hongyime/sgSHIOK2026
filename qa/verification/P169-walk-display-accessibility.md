# P169 Walk-Display Accessibility

## Scope

Browser accessibility copy/test-only change: rename the selected-route control and live-region status from generic route display to walk display.

## Command Output

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  00:31:38
   Duration  2.76s (transform 1.50s, setup 0ms, import 1.89s, tests 428ms, environment 1ms)
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

1. The route-toggle visible buttons already used product-facing labels, but the control accessible name was still `Route display`.
2. The score-card live region still announced `Route display ...`, even though the product frame is the selected walk to transit.

## Disagreements

1. The standing objective's P18 landed premise still does not match the current `origin/main`; this work continues from the authoritative current tree.
