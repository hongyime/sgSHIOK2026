# P979 Static JSON In-Flight Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
61e33e6b9c06dff4aca780247de5eb3763921b49
61e33e6b9c06dff4aca780247de5eb3763921b49	refs/heads/main
```

## Change

`fetchJson()` now keeps a path-level in-flight request map for immutable static bundle JSON files. Concurrent callers for the same bundle path share the same pending fetch, then the existing resolved-data caches continue to serve later calls.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-prefix-index data-fetch-policy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  21:30:34
   Duration  3.68s (transform 559ms, setup 0ms, import 535ms, tests 609ms, environment 2ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Static bundle helpers cached resolved score, geometry, transit, and index payloads, but concurrent calls before the first response could still duplicate the same Vercel Edge request.
2. A path-level in-flight cache reduces duplicate requests across the static data loader without changing score values, geometry, routing, exports, or protected payloads.

## DISAGREEMENTS

1. None.
