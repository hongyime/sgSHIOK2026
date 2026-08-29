# P1002 Route preview cache cap

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction hardening after P1000.

Change:

- Cap persisted live OneMap route-preview cache entries at 30.
- Prune expired, malformed, and oldest route-preview cache entries before writing.
- Retry the write once after pruning if browser storage is full.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Command Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- route-evidence-map-interaction
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (11 tests | 1 failed) 7009ms
     × summarizes the night-lighting overlay for non-visual map users 5057ms

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:24:42
   Duration  11.69s (transform 6.54s, setup 0ms, import 373ms, tests 7.01s, environment 1ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- route-evidence-map-interaction
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (11 tests | 1 failed) 635ms
     × keeps arbitrary clicked OneMap routes preview-only and resettable 60ms

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:27:12
   Duration  1.70s (transform 671ms, setup 0ms, import 270ms, tests 635ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> npm --prefix web test -- route-evidence-map-interaction
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web
 
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  23:27:42
   Duration  4.61s (transform 2.11s, setup 0ms, import 717ms, tests 2.02s, environment 1ms)
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P1002-route-preview-cache-cap.md; if ($LASTEXITCODE -eq 0) { "p1002_check_ignore_exit=0" } else { "p1002_check_ignore_exit=$LASTEXITCODE" }
p1002_check_ignore_exit=1
```

## Findings

1. P1000 made route previews persistent for one day, but `route_geometry` payloads can be substantially larger than search-result payloads.
2. Without a cap, repeated clicked-stop exploration could fill browser storage and reduce the reliability of the quota-saving cache.
3. A 30-entry cap preserves the common repeat-visit/share-link benefit while bounding client storage growth.
4. The first focused test run timed out in an unrelated dynamic import assertion; rerun passed 11/11 without code changes.
5. A pre-commit review caught that pruning to 30 entries before writing could still leave 31 entries after the write; the implementation now prunes to `LIVE_ROUTE_PREVIEW_CACHE_MAX_ENTRIES - 1` before storing the new payload.
6. A second focused test failure was a stale source-string assertion after that boundary correction; the assertion now matches the corrected pre-write prune.

## Disagreements

1. None.
