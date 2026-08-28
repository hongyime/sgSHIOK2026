# P778 Night-Lighting Detail Priority

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Moved Night lighting before Greenery proxy in the score-card walk-details strip. Shelter exposure still leads the card; night lighting now appears as the second product layer before heat-proxy caveat detail.

No scoring, export, rescore, subset run, ingest, network build, input refresh, public-data write, protected payload write, deployment, or locked-weight edit was performed.

## Commands

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  01:32:20
   Duration  7.47s (transform 1.79s, setup 0ms, import 2.29s, tests 2.94s, environment 1ms)
```

### npm --prefix web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/data.test.ts (5 tests | 1 failed) 24448ms
     × geometry postal prefix shards match the full postal index 19294ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/data.test.ts > generated data bundle > geometry postal prefix shards match the full postal index
Error: Test timed out in 15000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/data.test.ts:95:3
     93|   });
     94|
     95|   it("geometry postal prefix shards match the full postal index", () =…
       |   ^
     96|     const geomPostalIndex = readJson<Record<string, string>>("geom/pos…
     97|     const expectedPrefixIndex: Record<string, Record<string, string>> …

⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 23 passed (24)
      Tests  1 failed | 165 passed (166)
   Start at  01:32:53
   Duration  90.80s (transform 7.95s, setup 0ms, import 11.79s, tests 46.90s, environment 21ms)
```

### npm --prefix web test -- data.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  01:34:37
   Duration  4.82s (transform 170ms, setup 0ms, import 223ms, tests 3.78s, environment 0ms)
```

### uv run pytest -q --collect-only

```text
618 tests collected in 13.43s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### protected diff guard

```text
decisions.md                              |  4 ++++
web/app/page.tsx                          | 12 ++++++------
web/lib/__tests__/score-card-copy.test.ts |  3 +++
3 files changed, 13 insertions(+), 6 deletions(-)
```

## FINDINGS

1. The walk-details strip listed Greenery proxy before Night lighting, which understated the settled product hierarchy where night lighting is the second layer and greenery is a supporting heat-proxy caveat.
2. The full web test run hit the existing 15s timeout on `data.test.ts`; the same test file passed in isolation immediately after, so this slice records it as timing risk rather than a copy/order regression.

## DISAGREEMENTS

1. None.
