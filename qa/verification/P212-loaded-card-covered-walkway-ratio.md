# P212 Loaded-card Covered-walkway Ratio

Date: 2026-08-21

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
a682c9e77570c9a546070d8c5a1db4d9e7563cb0
a682c9e77570c9a546070d8c5a1db4d9e7563cb0	refs/heads/main
```

## Scope

```text
Browser copy only.
No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, or locked-weight change.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  04:31:49
   Duration  6.14s (transform 2.59s, setup 0ms, import 3.66s, tests 816ms, environment 2ms)
```

## Evidence Ignore Check

```text
exit=1
```

## Repo Integrity

```text
repo_integrity=ok
exit=0
```

## Locked Weights Diff Check

```text
exit=0
```

## FINDINGS

1. The loaded shelter-map card still had a summary metric labelled `Sheltered`, while the settled product framing and first view now say covered-walkway ratio.
2. Clicked-stop preview rows used `Shelter evidence` for the same percentage, making the same field appear under multiple names.
3. Direct-bus fallback reason chips still said `62% sheltered on selected walk`; the test update keeps the fallback distinction but renames the ratio to covered-walkway ratio.

## DISAGREEMENTS

1. None.
