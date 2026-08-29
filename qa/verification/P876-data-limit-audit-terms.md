# P876 Data Limit Audit Terms

## Guard

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Protected operations: no scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, public-data write, or protected evidence/data mutation.
```

## Change

```text
Translated browser Data limits detail away from internal audit terms:
- full-universe gap -> complete missing-address count
- promote v2 -> replace the June 2020 address list
- frozen postals -> June 2020 address-list postcodes
- frozen v1 data -> published data
- new numbered input version -> new dated input version
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  13:19:28
   Duration  5.31s (transform 1.74s, setup 0ms, import 2.24s, tests 1.32s, environment 1ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. Several expanded Data limits sentences still exposed internal audit/versioning language even after the primary UI had shifted to June 2020 address-list wording.
2. The same facts can be stated more directly for a housing-search user without weakening the versioned-refresh constraint.

## DISAGREEMENTS

1. None.
