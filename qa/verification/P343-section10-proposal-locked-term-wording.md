# P343 Section 10 Proposal Locked-Term Wording

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  13:18:17
   Duration  865ms (transform 124ms, setup 0ms, import 153ms, tests 65ms, environment 0ms)
```

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:380:    expect(proposalSource).toContain("stop presenting the prior five locked-term rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:381:    expect(proposalSource).not.toContain("stop presenting the prior five component-score rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:386:    expect(proposalSource).not.toContain("stop presenting the current five component-score rows");
C:\sgSHIOK2026\web\section10-presentation-proposal.md:9:stop presenting the prior five locked-term rows as five independent measurements.
```

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The committed Section 10 proposal still preserved `component-score rows` wording after the app, README, and readiness surfaces had moved to locked-term language.

## Disagreements

1. None.
