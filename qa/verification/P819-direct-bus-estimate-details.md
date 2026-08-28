# P819 Direct-Bus Estimate Details

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
6a2b9fd2aba22903a2ddf990b30c2563214aa5ce
6a2b9fd2aba22903a2ddf990b30c2563214aa5ce	refs/heads/main
```

## Evidence Path Ignore Check

```text
exit=1
```

## Focused Test Before Source Guard Update

```text
Test Files  1 failed | 1 passed (2)
Tests  1 failed | 62 passed (63)
```

## Focused Test After Fix

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  07:42:52
   Duration  5.26s (transform 1.71s, setup 0ms, import 2.19s, tests 1.64s, environment 1ms)
```

## FINDINGS

1. Direct-bus fallback records with exposed gaps could still render `Where the walk is exposed` even though `direct_bus_fallback_unrouted` is an estimate, not a verified shelter-map walk.
2. The fallback route-details region still used `aria-label="Walk details"`, so assistive technology could hear the fallback evidence as a walk detail.
3. Access-link detail copy still said the connector joined `the shelter-map walk` for fallback records with `endpoint_snap_connector_m`; it now names the straight-line bus estimate.

## DISAGREEMENTS

1. None.
