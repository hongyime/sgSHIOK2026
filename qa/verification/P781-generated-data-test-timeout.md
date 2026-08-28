# P781 Generated-Data Test Timeout

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Raised only the generated-bundle geometry postal-prefix consistency test timeout from 15 seconds to 60 seconds. The test reads the local public-data bundle and all geometry prefix shards; on E14 it had timed out at the fixed 15-second boundary despite no data or product code failure.

No scoring, export, rescore, subset run, ingest, network build, input refresh, public-data write, protected payload write, deployment, or locked-weight edit was performed.

## Commands

### npm --prefix web test -- data.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  01:48:53
   Duration  4.60s (transform 219ms, setup 0ms, import 279ms, tests 3.56s, environment 1ms)
```

### npm --prefix web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  01:49:15
   Duration  102.40s (transform 8.27s, setup 0ms, import 14.36s, tests 40.18s, environment 34ms)
```

### uv run pytest -q --collect-only

```text
619 tests collected in 35.53s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### protected diff guard

```text
decisions.md                   | 4 ++++
web/lib/__tests__/data.test.ts | 2 +-
2 files changed, 5 insertions(+), 1 deletion(-)
```

## FINDINGS

1. `web/lib/__tests__/data.test.ts::geometry postal prefix shards match the full postal index` is a valid generated-bundle consistency check, but its previous 15-second timeout was below observed E14 runtime when reading the local gitignored public-data shard set.

## DISAGREEMENTS

1. None.
