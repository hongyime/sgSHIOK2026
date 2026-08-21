# P451 Section 10 Bus Caveat Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier documentation/test alignment only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

The shipped browser copy says a low bus value can mean weak service evidence or that the published shelter-map walk could not prove access to an official LTA bus stop. The Section 10 reference still used the older `trusted walk to a DataMall bus stop` phrase. P451 aligns the reference document with the shipped browser language.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=69a63c07ce4b2c4513b6ddd816d93f39cf3743a2
ORIGIN_MAIN=69a63c07ce4b2c4513b6ddd816d93f39cf3743a2	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P451-section10-bus-caveat-copy.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:14:42
   Duration  593ms (transform 108ms, setup 0ms, import 132ms, tests 57ms, environment 0ms)
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; echo EXIT=$LASTEXITCODE
repo_integrity=ok
EXIT=0
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases; echo EXIT=$LASTEXITCODE
EXIT=0
```

## Findings

1. The Section 10 reference still carried the old DataMall bus-stop phrase after the app had moved to official LTA bus-stop wording. It now matches the shipped caveat.

## Disagreements

1. None.
