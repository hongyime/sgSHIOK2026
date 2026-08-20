# P214 Map Empty-summary Covered-walkway Ratio

Date: 2026-08-21

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
446a3796ea6b5e8fae9a629e0a61e80623f4584c
446a3796ea6b5e8fae9a629e0a61e80623f4584c	refs/heads/main
```

## Scope

```text
Browser accessibility copy only.
No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, or locked-weight change.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  25 passed (25)
   Start at  04:37:35
   Duration  1.29s (transform 628ms, setup 0ms, import 372ms, tests 472ms, environment 1ms)
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

1. The map-side empty non-visual summary still used generic `shelter map evidence` wording after the first view and loaded card had moved to covered-walkway ratio wording.
2. The route-evidence interaction test still expected the pre-P212 preview metric label `Shelter evidence`; this was corrected to `Covered-walkway ratio` while preserving the preview-only/locked-score assertions.
3. The change is accessibility/browser copy only; map data, route geometry, scores, exports, public data, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
