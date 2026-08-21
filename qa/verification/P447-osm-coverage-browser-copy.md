# P447 OSM Coverage Browser Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier browser copy and tests only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

P443 measured live OSM `addr:postcode` coverage as 25,873 of 124,443 frozen postals with 6 valid OSM-only postcodes. P447 surfaces that measured boundary in the first-view browser copy so users see why OpenStreetMap is treated as geometry evidence rather than the address registry.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=2d2e4b4dfa96acea78fc5074e46a6e4fc32471e2
ORIGIN_MAIN=2d2e4b4dfa96acea78fc5074e46a6e4fc32471e2	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P447-osm-coverage-browser-copy.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:00:53
   Duration  1.81s (transform 325ms, setup 0ms, import 392ms, tests 153ms, environment 1ms)
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; echo EXIT=$LASTEXITCODE
repo_integrity=ok
EXIT=0
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases; echo EXIT=$LASTEXITCODE
EXIT=0
```

## Findings

1. The browser first-view source line said OpenStreetMap contributes geometry evidence rather than the address universe, but it did not expose the measured P125 coverage behind that boundary. The UI now names the 25,873-of-124,443 coverage and 6 valid OSM-only postcodes.

## Disagreements

1. None.
