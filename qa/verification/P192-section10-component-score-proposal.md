# P192 Section 10 Component Score Proposal

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. The tracked Section 10 proposal still said `five subscore rows` even though the app and readiness warnings now use component-score wording.
2. The proposal is not runtime UI, but it is the owner-facing copy/design artifact for the next product presentation step and should not preserve stale implementation vocabulary.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  02:13:21
   Duration  960ms (transform 135ms, setup 0ms, import 168ms, tests 55ms, environment 0ms)
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:289:    expect(proposalSource).toContain("stop presenting the current five component-score rows");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:290:    expect(proposalSource).not.toContain("five subscore rows");
C:\sgSHIOK2026\web\section10-presentation-proposal.md:9:stop presenting the current five component-score rows as five independent measurements.
```

## FINDINGS

1. The Section 10 proposal retained stale `subscore` wording in its framing of the five current rows.

## DISAGREEMENTS

1. None.
