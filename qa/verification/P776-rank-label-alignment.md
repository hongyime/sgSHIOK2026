# P776 Planning-Area Rank Label Alignment

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Aligned planning-area rank labels with the shelter-first presentation:

- `rain` is covered-walkway evidence.
- `access` remains walk-distance evidence.
- `bus`, `heat`, and `crossing` are locked-score factors, not standalone evidence axes.

No scoring, export, rescore, subset run, ingest, network build, input refresh, protected payload write, deployment, or locked-weight edit was performed.

## Commands

### npm --prefix web test -- subscore-ranking.test.ts accessibility-render.test.tsx score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs subscore-ranking.test.ts accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  59 passed (59)
   Start at  01:17:46
   Duration  7.58s (transform 2.19s, setup 0ms, import 2.80s, tests 1.59s, environment 4ms)
```

### npm --prefix web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  01:18:17
   Duration  54.16s (transform 3.27s, setup 0ms, import 6.30s, tests 14.54s, environment 21ms)
```

### uv run pytest -q --collect-only

```text
618 tests collected in 25.50s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### protected diff guard

```text
decisions.md                                    |  4 ++++
web/app/page.tsx                                |  2 +-
web/lib/__tests__/accessibility-render.test.tsx | 21 ++++++++++++++-------
web/lib/__tests__/score-card-copy.test.ts       | 16 ++++++++++++++--
web/lib/__tests__/subscore-ranking.test.ts      |  8 ++++----
web/lib/subscore-ranking.ts                     |  6 +++---
6 files changed, 40 insertions(+), 17 deletions(-)
```

## FINDINGS

1. Planning-area ranking still exposed bus and heat as evidence views even though the product framing now treats bus support, heat proxy, and crossing friction as locked-score factors behind the primary shelter evidence.

## DISAGREEMENTS

1. None.
