# P1045 Map Load and Declutter

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

No scoring, export, rescore, subset run, ingest, network build, input rebuild, dependency install, protected payload mutation, deployment, or `pipeline/config/weights.yaml` edit was performed.

## Reproduction Before Fix

```text
npm --prefix web run qa:browser -- --url http://127.0.0.1:3001/ --postal 018956 --input-mode programmatic --screenshots --debug-port 9231 --timeout-ms 45000 --out ../qa/debug-runs/p1045-map-before/summary.json
```

Observed summary fields:

```json
{
  "map_label": "",
  "map_summary": "",
  "route_debug": null,
  "route_source_features_present": false,
  "route_rendered_features_present": false,
  "ok": false
}
```

## Changes

- Postal selection now opens the route map automatically after a result loads.
- The map component and MapLibre are preloaded on search intent and input focus.
- Route score/geometry rendering no longer waits for transit POI shard/fallback loading; transit POIs fill in after the main route is visible.
- Missing compressed-only transit H3 shards no longer retry as uncompressed `.json`.
- Route fitting now retries after layout/style settle and on container resize.
- The loaded mobile overlay is more compact so the route remains visible.
- Long runtime copy for locked-score coverage, night-lighting layer explanations, moving-here guidance, and the personal-looking Mayflower sample was removed from visible UI.

## Final Browser Smoke

```text
npm --prefix web run qa:browser -- --url http://127.0.0.1:3001/ --postal 018956 --input-mode keyboard --screenshots --debug-port 9242 --timeout-ms 60000 --out ../qa/debug-runs/p1045-map-final-compact/summary.json
```

```json
{
  "generated_at": "2026-08-30T10:51:41.024Z",
  "url": "http://127.0.0.1:3001/",
  "input_mode": "keyboard",
  "expected_state": "scored",
  "transit_mode": "best_transit",
  "walk_mode": "shiokest",
  "route_mode": "shiokest",
  "postal": "018956",
  "map_label": "Shelter-map view for Postal 018956, showing sheltered walk",
  "map_summary": "Shelter-map view for Postal 018956. Showing 4 sheltered-walk segments, 3 exposed gaps, and 7 MRT or LRT stations, 34 exits, and 27 bus stops.",
  "route_debug": {
    "mode": "shiokest",
    "routeCount": 1,
    "sourceFeatureCounts": {
      "shortest": 0,
      "shiokest": 4,
      "exposure": 3,
      "transit": 1,
      "activeGap": 0,
      "lamp": 0
    },
    "lampStatus": "off"
  },
  "metrics": {
    "viewportWidth": 390,
    "viewportHeight": 667,
    "overlayClientHeight": 227,
    "overlayScrollHeight": 1367
  },
  "checks": {
    "map_has_text_equivalent": true,
    "keyboard_search_used": true,
    "route_network_ok": true,
    "route_source_features_present": true,
    "route_rendered_features_present": true
  },
  "ok": true
}
```

Screenshots written by the smoke run:

```text
C:\sgSHIOK2026\qa\debug-runs\p1045-map-final-compact\screenshots\summary_desktop.png
C:\sgSHIOK2026\qa\debug-runs\p1045-map-final-compact\screenshots\summary_mobile.png
C:\sgSHIOK2026\qa\debug-runs\p1045-map-final-compact\screenshots\summary_mobile_short.png
```

Visual inspection: desktop and short-mobile screenshots show a fitted Bayfront route with the shelter/exposure lines visible. The short-mobile overlay height is 227 CSS px, down from 253 CSS px in the prior compact run.

## Source Scan

```text
rg -n "560234|Mayflower|Locked-score coverage|Night lighting layer:|If you moved here|Try Mayflower|Show night-lighting layer" web
```

Visible runtime source no longer contains the personal sample CTA or the removed long copy. Remaining hits are helper modules, test fixtures, test assertions that the strings are absent, and non-UI test data.

## Tests

Focused web:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts deployment.test.ts data-fetch-policy.test.ts transit-shards.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  6 passed (6)
      Tests  110 passed (110)
   Start at  18:50:27
   Duration  22.09s (transform 4.54s, setup 0ms, import 5.96s, tests 4.21s, environment 6ms)
```

Full web:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  25 passed (25)
      Tests  215 passed (215)
   Start at  18:53:02
   Duration  70.79s (transform 3.25s, setup 0ms, import 6.18s, tests 43.18s, environment 13ms)
```

Repo integrity:

```text
repo_integrity=ok
0
```

## FINDINGS

1. The map failure was real: after the lazy-map change, postal search could leave the route map unmounted behind a `Show map` gate, so a normal user could load a result and still not see the map.
2. `loadSelection` was doing transit POI shard/fallback work before publishing the selected score and route geometry to the UI. That made the perceived map load slower than necessary even when the score and geometry were already available.
3. Missing transit H3 shards were retried as uncompressed `.json` after a failed `.json.gz` fetch. The active bundle stores those shards only as compressed artifacts, so the second request was wasted.
4. The prior normal-user UI still exposed too much audit/provenance copy and a personal-looking sample postal. The visible UI now keeps those details out of the primary path.

## DISAGREEMENTS

1. I do not think the map should mount on an empty first page again. The cheaper and better behavior is what this change implements: keep the empty page light, but automatically open and preload the map once the user shows search intent or loads a result.
