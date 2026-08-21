# P446 P19 Browser Cluster Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier browser copy and tests only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

P445 made the confirmed P19 HDB missing-address clusters visible in README and CLAUDE. P446 carries the same cluster names into generic browser outside-bundle and no-result caveats, so users who search a missing or unknown postal see the measured developments rather than only the aggregate count.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=ef444531a835186278efa7cc24f2a1e594b32473
ORIGIN_MAIN=ef444531a835186278efa7cc24f2a1e594b32473	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P446-p19-browser-cluster-copy.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  21:57:28
   Duration  1.44s (transform 728ms, setup 0ms, import 956ms, tests 314ms, environment 0ms)
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

1. The browser generic recent-source caveat still named only the P19 split count; after P446, it also names SUN PLAZA SPRING and YISHUN BEACON as confirmed HDB gaps and CANAAN and MYRA as unvalidated MCST proxy rows.

## Disagreements

1. None.
