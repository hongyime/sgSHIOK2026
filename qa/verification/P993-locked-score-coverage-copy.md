# P993 Locked Score Coverage Copy

## Working Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## Scope

```text
First-view locked-score availability copy alignment.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, protected payload mutation, or weights.yaml change was performed.
```

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability accessibility-render data-base data-fetch-policy typescript-contract

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  5 passed (5)
      Tests  55 passed (55)
   Start at  22:35:05
   Duration  19.53s (transform 2.27s, setup 0ms, import 3.29s, tests 10.01s, environment 6ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs data

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  16 passed (16)
   Start at  22:35:05
   Duration  12.01s (transform 690ms, setup 0ms, import 1.13s, tests 6.52s, environment 3ms)
```

```text
repo_integrity=ok
```

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The first-view availability line still began `Full locked scores`, which gave the secondary locked composite headline weight before the user chose an address.
2. The line now begins `Locked-score coverage` and keeps the exact live-bundle counts, the June 2020 address-list boundary, and the roughly-quarter missing-full-score disclosure.
3. The generated-data test still reads the existing public bundle read-only and confirms the formatter output against the live manifest counts.

## DISAGREEMENTS

1. I did not hide or soften the exact locked-score counts. The product needs the roughly-quarter limitation visible; this change adjusts framing, not the disclosed evidence.
2. I did not build or deploy. Source-level and read-only generated-data tests cover this copy formatter change.
