# P608 Geometry Prefix Index Coherence

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier browser/generated-data validation only.

No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data writes, protected QA mutation, deployment, or locked-weight changes were performed.

## Read-only artifact probe

```text
postal_index_entries=114140
expected_prefixes=523
prefix_files=523
prefix_entries=114140
missing_prefix_files=0
extra_prefix_files=0
mismatched_prefix_files=0
```

## Focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  07:32:01
   Duration  17.19s (transform 252ms, setup 0ms, import 356ms, tests 14.70s, environment 1ms)
```

## Full web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  157 passed (157)
   Start at  07:33:22
   Duration  60.65s (transform 2.78s, setup 0ms, import 5.19s, tests 31.37s, environment 14ms)
```

## Python collect-only

```text
457 tests collected in 23.24s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Evidence path check-ignore

```text
exit=1
```

## Protected-path diff

```text
exit=0
```

## FINDINGS

1. The browser-side generated-data test suite now verifies `geom/postal-prefix/{prefix}.json` shards against `geom/postal-index.json`, closing the same lookup-contract gap for geometry that P607 closed for score prefix shards.
2. The protected public geometry prefix artifacts were read-only checked and are internally coherent: 114,140 postal-index entries, 523 expected prefixes, 523 prefix files, 114,140 prefix entries, and zero missing, extra, or mismatched prefix files.

## DISAGREEMENTS

1. None.
