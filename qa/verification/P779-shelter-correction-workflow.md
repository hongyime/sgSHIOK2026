# P779 Shelter-Correction Workflow

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Made the existing user trace workflow visible as a shelter-correction action:

- Added `Report missing shelter` near exposed gaps.
- Renamed overflow tracing from generic better-walk copy to shelter-correction copy.
- Renamed copied payload action from internal QA JSON to correction report.
- Changed the new payload issue to `user_reported_shelter_correction` while retaining `legacy_issue: user_reported_better_walk`.

No scoring, export, rescore, subset run, ingest, network build, input refresh, public-data write, protected payload write, deployment, or locked-weight edit was performed.

## Commands

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  01:41:05
   Duration  11.10s (transform 3.17s, setup 0ms, import 4.15s, tests 3.36s, environment 3ms)
```

### npm --prefix web test -- data.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/data.test.ts (5 tests | 1 failed) 18612ms
     × geometry postal prefix shards match the full postal index 15219ms

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

⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  01:41:49
   Duration  22.17s (transform 725ms, setup 0ms, import 831ms, tests 18.61s, environment 2ms)
```

### uv run pytest -q --collect-only

```text
618 tests collected in 46.27s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### protected diff guard

```text
decisions.md                                    |  4 ++++
web/app/page.module.css                         | 15 +++++++++++++++
web/app/page.tsx                                | 18 ++++++++++++++----
web/lib/__tests__/accessibility-render.test.tsx | 10 ++++++----
web/lib/__tests__/score-card-copy.test.ts       | 18 ++++++++++++------
5 files changed, 51 insertions(+), 14 deletions(-)
```

## FINDINGS

1. The correction workflow already existed mechanically, but the visible entry was hidden in the overflow menu and labelled as `Suggest better walk`, while the copy action said `Copy walk QA JSON`. That is internal route/QA language, not shelter-first product language.
2. `web/lib/__tests__/data.test.ts` is currently prone to the existing 15s timeout in `geometry postal prefix shards match the full postal index`; this slice did not touch data loading or generated bundle files, and the changed-surface tests passed.

## DISAGREEMENTS

1. None.
