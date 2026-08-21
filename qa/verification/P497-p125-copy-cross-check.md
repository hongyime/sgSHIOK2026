# P497 P125 Copy Cross-Check

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

README, CLAUDE, production-readiness copy, and browser first-view source copy now describe the P125 result as an `Overpass coverage cross-check` / `OSM addr:postcode coverage cross-check`.

This aligns user-facing and agent-facing copy with the P496 structured status label and the settled policy that OSM addr:postcode is geometry evidence, not the address registry.

## Searches

```text
C:\sgSHIOK2026\tests\test_agent_docs.py:36:    assert "P125's 20 Aug 2026 Overpass check found" not in normalized
C:\sgSHIOK2026\tests\test_readme.py:43:    assert "P125 20 Aug 2026 Overpass measurement found" not in normalized
```

## Tests

```text
...............................                                          [100%]
31 passed in 84.80s (0:01:24)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  02:32:33
   Duration  5.94s (transform 290ms, setup 0ms, import 358ms, tests 234ms, environment 1ms)
```

## FINDINGS

1. After P496 corrected structured status output, README, CLAUDE, production-readiness copy, and browser first-view source copy still used weaker `measurement` or `check` wording for the same P125 evidence.
2. The stale wording did not change counts, but it weakened the settled release-policy distinction between OSM as a coverage cross-check and OSM as an address registry.

## DISAGREEMENTS

1. None.
