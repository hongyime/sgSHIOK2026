# P658 live preview distance copy

## Scope

- Free-tier UI copy/test change only.
- No scoring, export, rescore, subset run, ingest, network build, upstream API probe, public-data write, protected QA mutation, deployment, or locked-weight change.
- Existing evidence files were not modified.

## Change

- OneMap live preview loading and unavailable states now describe the temporary fallback as straight-line distance instead of straight-line preview.

## Command Output

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  65 passed (65)
   Start at  12:35:24
   Duration  18.46s (transform 5.08s, setup 0ms, import 6.58s, tests 4.10s, environment 4ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:36:22
   Duration  36.75s (transform 2.45s, setup 0ms, import 4.61s, tests 13.89s, environment 11ms)
```

```text
457 tests collected in 20.27s
```

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
exit=0
```

## FINDINGS

1. The old live-preview fallback copy repeated `preview` in both the OneMap status and fallback description, making the temporary fallback less concrete than the UI state requires.
2. The corrected copy keeps the honest limitation: when the OneMap walking preview is loading or unavailable, the selected transit target is shown by straight-line distance only.

## DISAGREEMENTS

1. None.
