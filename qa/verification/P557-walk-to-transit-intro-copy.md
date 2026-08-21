# P557 Walk-To-Transit Intro Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
106b98d6e2fc6f104b3ad8d46bdaafc35c522bfc
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Scope

```text
Change first-use title card, empty panel, and no-route map summary copy from evidence "near transit" to evidence "on the walk to transit".
No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change.
```

## String Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1151:          <span>Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.</span>
C:\sgSHIOK2026\web\app\page.tsx:2165:            <p>See covered-walkway ratio, exposed gaps, and night lighting on the walk to transit</p>
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:1050:      "Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:199:    expect(html).toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:200:    expect(html).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting near transit.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:201:    expect(html).not.toContain("Search a Singapore postal code to inspect the covered-walkway ratio, exposed gaps, and night lighting near transit.");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:59:    expect(source).toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting on the walk to transit.");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:60:    expect(source).not.toContain("Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio, exposed gaps, and night lighting near transit.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:158:    expect(source).toContain("See covered-walkway ratio, exposed gaps, and night lighting on the walk to transit");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:159:    expect(source).not.toContain("See covered-walkway ratio, exposed gaps, and night lighting near transit");
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  55 passed (55)
   Start at  07:11:45
   Duration  2.69s (transform 2.23s, setup 0ms, import 3.12s, tests 1.07s, environment 2ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:12:34
   Duration  10.50s (transform 7.49s, setup 0ms, import 9.42s, tests 14.03s, environment 12ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 19.82s
```

## Repository Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence Check Ignore

```text
check_ignore_exit=1
```

## Protected Path Diff

```text
```

## FINDINGS

1. First-use copy described shelter evidence as near transit, but the product's actual evidence is on the walk to transit.
2. The same weaker framing appeared in the no-selection panel, title card, and route-map text equivalent.

## DISAGREEMENTS

1. None.
