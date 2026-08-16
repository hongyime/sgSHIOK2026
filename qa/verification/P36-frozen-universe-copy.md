# P36 Frozen Universe Copy

Date: 2026-08-16

## Startup Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
781596abf4fc037bfc4883852260593445a2dc33
781596abf4fc037bfc4883852260593445a2dc33	refs/heads/main
```

## Source Evidence

```text
raw\manifest.json:172:      "source_name": "OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84",
pipeline\postal_universe.py:260:            "OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84",
pipeline\postal_universe.py:276:            "OneMap-derived Singapore postal dump, accessed 10 Jun 2020 by xuancong84",
```

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## Focused Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  12:43:38
   Duration  990ms (transform 117ms, setup 0ms, import 153ms, tests 41ms, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts
```

```text
EXIT_CODE=0
```

## Full Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  117 passed (117)
   Start at  12:43:51
   Duration  7.36s (transform 4.85s, setup 0ms, import 6.70s, tests 9.93s, environment 10ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
EXIT_CODE=0
```

## Scope

No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or `pipeline/config/weights.yaml` change was run.

## FINDINGS

1. The title card said `Data as of`, which could imply the address universe is current even though the next line says the address universe is frozen.
2. The title card said `2020 SLA-derived postal set`, while the local manifest and pipeline source name the source as a OneMap-derived postal dump accessed on 10 Jun 2020.
3. P36 changes the visible copy to `Route evidence as of` and names the address universe as a June 2020 OneMap-derived postal scrape.

## DISAGREEMENTS

1. None.
