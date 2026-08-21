# P449 LAI Browser Boundary

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier browser copy and tests only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

The first-view browser freshness block named NParks Leaf Area Index as near its freshness threshold, while selected-record heat details already said route heat evidence uses sparse walk-adjacent greenery geometry and not Leaf Area Index. P449 makes that boundary visible before search: LAI is a freshness-only reference table here, not route heat evidence, not LAI-derived score evidence, and not measured temperature.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=dc82a56df1c26380d3bb81f9bbb0e8d9ffbb02d1
ORIGIN_MAIN=dc82a56df1c26380d3bb81f9bbb0e8d9ffbb02d1	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P449-lai-browser-boundary.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:07:03
   Duration  425ms (transform 67ms, setup 0ms, import 84ms, tests 44ms, environment 0ms)
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

1. The first-view browser freshness block mentioned Leaf Area Index freshness without saying that LAI is not route-level heat evidence. That boundary is now visible before search.

## Disagreements

1. None.
