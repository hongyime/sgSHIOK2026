# P452 Section 10 Heat Proxy Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier documentation/test alignment only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

The browser avoids the shorthand `Heat: shelter + NParks shade proxy` because it can imply measured shade or thermal comfort. The Section 10 reference still used that shorthand in its pre-P18/before rows. P452 aligns the reference with current product wording: heat is shelter plus sparse NParks greenery proxy.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=b3e3f1eae83acb77c4a51e3cdb551185e9ee44ac
ORIGIN_MAIN=b3e3f1eae83acb77c4a51e3cdb551185e9ee44ac	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P452-section10-heat-proxy-copy.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:17:33
   Duration  862ms (transform 127ms, setup 0ms, import 162ms, tests 96ms, environment 1ms)
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

1. The Section 10 reference still used the old `NParks shade proxy` shorthand after the browser had moved to sparse greenery-proxy wording and explicit non-temperature caveats. It now matches the current framing.

## Disagreements

1. None.
