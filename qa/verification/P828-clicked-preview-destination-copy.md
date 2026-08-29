# P828 Clicked Preview Destination Copy

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Command Output

```text
npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  08:43:36
   Duration  8.05s (transform 2.42s, setup 0ms, import 3.03s, tests 2.12s, environment 1ms)
```

```text
git diff --check
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## FINDINGS

1. The preview-only caveat still said `this clicked stop or exit` after the selected-stop copy had moved to `MRT/LRT exit or bus stop`.
2. The caveat is shown when a user clicks a transit destination outside the published bundle, so it should use the same concrete destination language as the selected custom-transit badge.

## DISAGREEMENTS

1. None.
