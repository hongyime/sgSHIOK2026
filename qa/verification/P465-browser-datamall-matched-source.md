# P465 Browser DataMall Matched Source Boundary

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

The browser first-view Covered Linkway freshness caveat now names that traffic signals still matched in the same 21 Aug 2026 metadata-only DataMall discovery check that found Covered Linkway and bridge/underpass discovery URLs changed.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or input rebuild was run.

## Focused test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  23:36:01
   Duration  748ms (transform 119ms, setup 0ms, import 147ms, tests 59ms, environment 0ms)
```

## Evidence path ignore check

```text
EXIT=1
```

## Repository integrity

```text
repo_integrity=ok
EXIT=0
```

## Changed files

```text
decisions.md
web/app/page.tsx
web/lib/__tests__/score-card-copy.test.ts
qa/verification/P465-browser-datamall-matched-source.md
```

## FINDINGS

1. The browser caveat named the changed DataMall geospatial discovery layers but not the matched traffic-signals layer, while README and readiness policy already carried the full changed/matched split.
2. Naming the matched layer keeps the DataMall drift caveat bounded to the measured result instead of implying every checked geospatial layer moved.

## DISAGREEMENTS

1. None.
