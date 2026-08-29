# P875 Address Limit Copy

## Guard

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Protected operations: no scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, public-data write, or protected evidence/data mutation.
```

## Change

```text
Changed the expanded Data limits address line from an internal frozen-v1 framing to a user-facing June 2020 scrape limitation:
Address list: June 2020 OneMap-derived postal scrape; newer developments may be missing.
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  13:15:45
   Duration  16.28s (transform 9.06s, setup 0ms, import 11.97s, tests 1.65s, environment 2ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. The collapsed Data limits summary already led with June 2020 addresses, but the expanded address sentence still led with the internal `frozen v1` label.
2. The copy should name the practical housing-search limitation directly: newer developments may be missing.

## DISAGREEMENTS

1. None.
