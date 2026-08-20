# P170 Published-Walk Reset Copy

## Scope

Browser copy/accessibility test-only change: label the selected-stop reset as returning to the published walk instead of the scored route.

## Command Output

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  00:35:14
   Duration  3.90s (transform 2.45s, setup 0ms, import 2.39s, tests 1.66s, environment 1ms)
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

1. The custom-stop reset button still said `Scored route`, making the fallback from clicked-stop preview sound score-first.
2. The default score-card live region still said `Published route selected`, while the product frame is the selected walk to transit.

## Disagreements

1. The standing objective's P18 landed premise still does not match current `origin/main`; this work continues from the authoritative current tree.
