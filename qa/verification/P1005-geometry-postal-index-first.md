# P1005 Geometry Postal Index First

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### npm --prefix web test -- data-fetch-policy geom-promoted-shard

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-fetch-policy geom-promoted-shard

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  10 passed (10)
   Start at  23:44:30
   Duration  6.58s (transform 1.06s, setup 0ms, import 1.29s, tests 825ms, environment 3ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
```

### git check-ignore -v qa/verification/P1005-geometry-postal-index-first.md

```text
p1005_check_ignore_exit=1
```

## FINDINGS

1. `fetchGeomForPostal()` previously tried coordinate-derived H3 shards before postal indexes when OneMap search supplied coordinates. If OneMap coordinates drifted from the published geometry shard, the client could spend avoidable static bundle requests on a parent shard, the promoted-child index, and child shards before reaching a match.
2. The current bundle includes `geom/postal-prefix/{prefix}.json.gz`, so resolving geometry by postal first is the lower-request path for normal selected-postal loads.
3. Coordinate-derived H3 lookup remains as a fallback for older or incomplete bundles.
4. `pipeline/config/weights.yaml` remained untouched.

## DISAGREEMENTS

1. None for this change.
