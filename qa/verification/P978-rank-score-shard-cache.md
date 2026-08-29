# P978 Rank Score Shard Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
6c66fc3d3c019f20a6f397b8b96117553a2a93b9
6c66fc3d3c019f20a6f397b8b96117553a2a93b9	refs/heads/main
```

## Change

Nearby-address ranking now reuses the same cached score-shard loader as postal lookup. When a user loads a postal and then opens nearby-address comparison for that planning area, the primary score shard no longer needs to be fetched a second time.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-prefix-index

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  21:27:11
   Duration  1.64s (transform 1.01s, setup 0ms, import 108ms, tests 1.02s, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Postal lookup cached score shards through `fetchAreaRecords()`, but ranking loaded the same shard through a direct `fetchJson()` call.
2. Reusing `fetchAreaRecords()` reduces repeat static `/data/.../scores/*.json` requests without changing ranking values or published data.

## DISAGREEMENTS

1. None.
