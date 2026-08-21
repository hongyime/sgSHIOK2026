# P501 P19 Stale Test Literals

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

Removed old exact `8 missing rows` P19 copy literals from active test source. Current runtime copy, docs, and tests continue to assert the settled 6 coordinate-backed HDB rows plus 2 unvalidated MCST proxy rows.

Historical `decisions.md` entries remain append-only history and were not rewritten.

## Search

```text
C:\sgSHIOK2026\tests\test_agent_docs.py:24:        "The 16 Aug 2026 P19 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
C:\sgSHIOK2026\tests\test_production_readiness.py:500:        "the 16 Aug 2026 P19 public-source sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) sampled 2021-2026"
```

## Tests

```text
.....                                                                    [100%]
5 passed in 3.12s
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  02:55:18
   Duration  6.79s (transform 3.66s, setup 0ms, import 4.54s, tests 1.48s, environment 3ms)
```

## FINDINGS

1. Active test files still contained old P19 exact-copy literals describing `8 missing rows`, even though runtime copy had already moved to the 6 coordinate-backed HDB plus 2 unvalidated MCST proxy classification.
2. Keeping those stale literals in tests made source search noisier and risked confusing future agents about the current product wording.

## DISAGREEMENTS

1. None.
