# P902 Panel Ready Announcement

## Scope

Change the shelter-map screen-reader announcement from `shelter-map panel loaded` to `shelter-map panel ready`.

Browser-smoke telemetry keys that include `_loaded` were left unchanged because they are machine-readable status names rather than browser copy.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=7f19098ca27bbf7e09e3bb36286c6f7d27852b54
REMOTE=7f19098ca27bbf7e09e3bb36286c6f7d27852b54	refs/heads/main
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

### Copy search before edit

```text
web/scripts\browser-smoke.mjs:603:    shelter_map_panel_loaded: routeEvidencePanelLoaded,
web/scripts\browser-smoke.mjs:604:    route_evidence_panel_loaded: routeEvidencePanelLoaded,
web/scripts\browser-smoke.mjs:605:    score_panel_loaded: routeEvidencePanelLoaded,
web/app\page.tsx:300:  return `${postal} shelter-map panel loaded. ${stationName ?? "MRT/LRT exit or bus stop not named"}. ${shelterText} ${scoreLabel} ${scoreText}. ${stopText} ${displayContextLabel} ${routeDisplayLabel ?? routeMode}; ${selectedRouteLabel ?? "walk"} active.`;
web/lib\__tests__\accessibility-render.test.tsx:311:    expect(html).toContain("Postal 560231 shelter-map panel loaded.");
web/lib\__tests__\deployment.test.ts:53:    expect(script).toContain("shelter_map_panel_loaded");
web/lib\__tests__\deployment.test.ts:54:    expect(script).toContain("route_evidence_panel_loaded");
web/lib\__tests__\deployment.test.ts:57:    expect(script).toContain("score_panel_loaded: routeEvidencePanelLoaded");
web/lib\__tests__\score-card-copy.test.ts:226:    expect(smokeSource).toContain("shelter_map_panel_loaded");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:10:07
   Duration  24.37s (transform 7.65s, setup 0ms, import 9.52s, tests 6.08s, environment 2ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
```

Exit code: 0.

## FINDINGS

1. The visible assistive-status copy still used implementation language (`loaded`) after the surrounding browser copy had moved to user-facing shelter-map and stop-or-exit language.

## DISAGREEMENTS

1. None.
