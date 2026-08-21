# P448 Covered Linkway Freshness Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier browser copy and tests only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

The freshness policy already treats LTA geospatial files such as Covered Linkway as quarterly with a 120-day stale threshold, and README documents that a current local freshness result does not prove no newer listing exists. P448 surfaces the same versioning caveat in the first-view browser copy: frozen v1 uses the Mar 2026 LTA geospatial listing, and any refresh must be a new numbered input version.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=e406213ef16c82880b5ca5a1766925df284dbfe0
ORIGIN_MAIN=e406213ef16c82880b5ca5a1766925df284dbfe0	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P448-covered-linkway-freshness-copy.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:04:02
   Duration  684ms (transform 100ms, setup 0ms, import 127ms, tests 69ms, environment 0ms)
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

1. The browser freshness summary named stale supporting sources but did not expose the Covered Linkway quarterly cadence or the no-in-place-refresh boundary that protects frozen v1 comparability. That boundary is now visible in the first-view copy.

## Disagreements

1. None.
