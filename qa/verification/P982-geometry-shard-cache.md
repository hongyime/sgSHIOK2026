# P982 Geometry Shard Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
0f154a1e5a48dc5fe1acefde1c476f146ac97e90
0f154a1e5a48dc5fe1acefde1c476f146ac97e90	refs/heads/main
```

## Change

Geometry H3 shards are now cached in memory after lookup, including missing-shard results. Repeated route-geometry lookups for the same shard no longer spend repeated static `/data/.../geom/h3/*.json` requests during a single app session.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs geom-promoted-shard data-fetch-policy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  21:41:28
   Duration  2.49s (transform 351ms, setup 0ms, import 348ms, tests 283ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Score shards and transit shards had module-level caches, but geometry shards did not.
2. Repeated postal lookups or promoted-child fallback checks could refetch the same geometry shard, including known-missing parent shards.
3. Caching geometry shard successes and misses reduces repeat static data requests without changing geometry contents, scoring, routing, or protected payloads.

## DISAGREEMENTS

1. None.
