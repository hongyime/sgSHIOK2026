# P280 Selected Card Full Locked Score Copy

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P280-selected-card-full-locked-score-copy.md

```text
EXIT_CODE=1
```

## npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  09:27:20
   Duration  5.27s (transform 3.70s, setup 0ms, import 4.58s, tests 388ms, environment 1ms)
```

## old selected-card string checks

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:523:    expect(html).not.toContain("No full score in this bundle");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:58:    expect(smokeSource).not.toContain('summary.cardText.includes("No full score in this bundle")');
EXIT_CODE=0
EXIT_CODE=1
EXIT_CODE=1
EXIT_CODE=1
```

## python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT_CODE=0
```

## git diff -- pipeline/config/weights.yaml

```text
EXIT_CODE=0
```

## FINDINGS

1. Selected-card empty score states still used generic `No full score in this bundle` wording after the first-view availability line had moved to `full locked score`.
2. The selected-card title, reason chip, live announcement, and browser-smoke detector now use `No full locked score in this bundle`, keeping missing locked-score availability separate from shelter-map evidence availability.
3. This was browser copy/test/smoke coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
