# P977 Manifest Fetch Dedupe

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
f701440a425475dbee9c50bcdb59ce568b9d7a53
f701440a425475dbee9c50bcdb59ce568b9d7a53	refs/heads/main
```

## Change

`fetchManifest()` now memoizes the resolved manifest and shares one in-flight promise while the first manifest request is pending. This avoids duplicate `manifest.json.gz` requests when the app's mount-time fetch and an early postal search overlap.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data-fetch-policy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  21:24:17
   Duration  1.08s (transform 231ms, setup 0ms, import 230ms, tests 174ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. `fetchManifest()` previously delegated directly to `fetchJson("manifest.json")`, so concurrent callers could spend duplicate static data requests before browser caching had a chance to help.
2. The data loader already memoizes score, geometry, transit, and index payloads; manifest memoization brings the app's first static bundle request in line with the rest of the loader.

## DISAGREEMENTS

1. None.
