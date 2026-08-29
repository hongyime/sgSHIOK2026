# P980 Lamp Overlay Request Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
5c3330c8300b3680422856d06e6683d4a43afbe0
5c3330c8300b3680422856d06e6683d4a43afbe0	refs/heads/main
```

## Change

The lamp overlay data loader now caches successful static lamp manifest and tile JSON payloads by URL and deduplicates in-flight requests for the same URL. Failed artifact fetches remain retryable.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lamp-overlay

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  21:34:27
   Duration  1.02s (transform 133ms, setup 0ms, import 193ms, tests 67ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Lamp overlay requests use a separate fetch path from the main static bundle loader, so P979's generic `fetchJson()` in-flight cache did not cover lamp manifest or tile requests.
2. Quick map movement or remounts could request the same lamp tile more than once before the component-level cache was populated.
3. URL-level lamp artifact caching reduces repeat static `/data/lamp_posts_v1/...` Edge requests without changing the night-lighting layer semantics.

## DISAGREEMENTS

1. None.
