# P844 Browser Source-Inventory Copy

## Scope

Free-tier browser copy cleanup. No scoring, export, rescore, subset run, ingest, network build, deployment, source fetch, or protected payload mutation.

## Root And Host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The browser source-freshness detail now describes the source inventory by user-facing evidence categories instead of exposing `raw/manifest.json`, `ACRA`, and `other-UEN` in product UI copy.

## Command Output

### root, host, head, origin/main, status

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
e1681580ac84e609b9c78b777738b4ea6962fa68
e1681580ac84e609b9c78b777738b4ea6962fa68	refs/heads/main
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
?? qa/p19/hdb_2021_2026_onemap_geocode_cache.json
?? qa/p19/overpass_addr_postcodes_cache.json
?? qa/p19/universe_gap_measurement_detail.json
?? qa/p19/universe_gap_measurement_summary.json
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p572_post_refresh/
?? qa/p575_compare/p575_build_delta_report.py
?? qa/p575_compare/p575_delta_report.json
?? qa/p575_compare/p575_partitions/
?? qa/p575_compare/p575_subset_first50_universe.parquet
?? qa/p575_compare/p575_subset_universe.parquet
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  10:51:49
   Duration  5.52s (transform 2.60s, setup 0ms, import 3.14s, tests 1.05s, environment 1ms)
```

### rg -n "raw/manifest\.json|ACRA, other-UEN|source inventory covers address|The source policy covers every source" web\app web\lib\__tests__

```text
web\lib\__tests__\accessibility-render.test.tsx:235:      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived postal-universe seed"
web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).not.toContain("raw/manifest.json");
web\lib\__tests__\accessibility-render.test.tsx:238:    expect(html).not.toContain("ACRA, other-UEN");
web\app\page.tsx:112:  "At the 28 Aug 2026 manifest-only check, Bus Stops, Bus Services, and Bus Routes were the nearest current sources to their stale threshold, and HDB Existing Building was the oldest current item. Freshness may have changed since that snapshot; source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place. The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived postal-universe seed. Stale sources are ordered by days past their freshness threshold: Planning Area Boundaries (MP2019 No Sea), NParks Tracks, NParks Heritage Road Green Buffers, Traffic Signals, Pedestrian Overhead Bridge / Underpass, Covered Linkway, NParks Heritage Trees, NParks Nature Ways, and NParks Leaf Area Index.";
web\lib\__tests__\score-card-copy.test.ts:314:      "The source inventory covers address, transport, shelter, greenery, boundary, and lighting references, including the June 2020 OneMap-derived postal-universe seed"
web\lib\__tests__\score-card-copy.test.ts:316:    expect(source).not.toContain("The source policy covers every source in raw/manifest.json");
web\lib\__tests__\score-card-copy.test.ts:317:    expect(source).not.toContain("ACRA, other-UEN");
```

### python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"

```text
repo_integrity=ok
exit_code=0
```

### git diff --check; Write-Output "exit_code=$LASTEXITCODE"

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### protected-path diff guard

```text
exit_code=0
```

## FINDINGS

1. The browser data-limits disclosure still exposed repository-internal source policy wording after P840-P843. That was accurate operator language, but not product-facing copy.

## DISAGREEMENTS

1. None.
