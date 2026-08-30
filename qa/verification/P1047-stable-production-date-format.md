# P1047 Stable Production Date Format

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

No scoring, export, rescore, subset run, ingest, network build, input rebuild, protected payload mutation, or `pipeline/config/weights.yaml` edit was performed.

## Problem

The first live browser smoke after deploying P1045/P1046 loaded the map and route, but failed the no-page-errors check with React minified error 418.

```json
{
  "url": "https://sgshiok.vercel.app/",
  "postal": "018956",
  "map_label": "Shelter-map view for Postal 018956, showing sheltered walk",
  "map_summary": "Shelter-map view for Postal 018956. Showing 4 sheltered-walk segments, 3 exposed gaps, and 7 MRT or LRT stations, 34 exits, and 27 bus stops.",
  "checks": {
    "no_uncaught_page_errors": false,
    "route_network_ok": true,
    "route_source_features_present": true,
    "route_rendered_features_present": true
  },
  "ok": false
}
```

The page-error log recorded:

```text
Error: Minified React error #418
```

## Change

`formatDataDate()` and `formatGeneratedDate()` now pass `timeZone: "Asia/Singapore"` to `toLocaleDateString("en-SG", ...)`, removing server/client timezone drift from rendered date text.

## Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  61 passed (61)
   Start at  20:01:57
   Duration  22.81s (transform 8.77s, setup 0ms, import 10.12s, tests 5.52s, environment 2ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  25 passed (25)
      Tests  215 passed (215)
   Start at  20:02:43
   Duration  48.14s (transform 5.84s, setup 0ms, import 8.79s, tests 17.33s, environment 14ms)

repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. The production map rendered, but the deployed page still had a React hydration mismatch before this fix.
2. Date rendering without an explicit timezone is unsafe for this app because Vercel server rendering and Singapore browsers can format the same timestamp differently.

## DISAGREEMENTS

1. I do not consider a production smoke pass valid when `no_uncaught_page_errors` is false, even if the map visibly renders.

## Production Redeploy 2026-08-30

Deployment command:

```text
.\scripts\deploy-production.bat -ConfirmProduction -SkipWebTests
```

Deployment result:

```text
id=dpl_AtmhNoWvuSb7Y75BWeWNsY9JT5J2
deployment_url=https://sgshiok-jnwauvh1g-theprawnvercel.vercel.app
production_aliases=https://sgshiok.hong-yi.me, https://sgshiok.vercel.app, https://sgshiok-theprawnvercel.vercel.app
status=Ready
uploaded=404.6MB
```

Live browser smoke:

```text
npm --prefix web run qa:browser -- --url https://sgshiok.vercel.app/ --postal 018956 --input-mode keyboard --screenshots --debug-port 9244 --timeout-ms 90000 --out ../qa/debug-runs/p1047-production-map/summary.json
ok=true
no_uncaught_page_errors=true
route_network_ok=true
route_source_features_present=true
route_rendered_features_present=true
map_label=Shelter-map view for Postal 018956, showing sheltered walk
map_summary=Shelter-map view for Postal 018956. Showing 4 sheltered-walk segments, 3 exposed gaps, and 7 MRT or LRT stations, 34 exits, and 27 bus stops.
overlayClientHeight=227
screenshots=C:\sgSHIOK2026\qa\debug-runs\p1047-production-map\screenshots\summary_desktop.png, C:\sgSHIOK2026\qa\debug-runs\p1047-production-map\screenshots\summary_mobile.png, C:\sgSHIOK2026\qa\debug-runs\p1047-production-map\screenshots\summary_mobile_short.png
```

Visual inspection:

```text
desktop_map_visible=true
mobile_short_map_visible=true
personal_default_postal_removed=true
locked_score_coverage_copy_removed=true
night_lighting_long_copy_removed=true
```

Live favicon check:

```text
https://sgshiok.vercel.app/favicon.ico
X-Matched-Path=/icon.svg
X-Nextjs-Rewritten-Path=/icon.svg
Content-Type=image/svg+xml
Content-Length=747
Cache-Control=public, max-age=31536000, immutable

https://sgshiok.vercel.app/icon.svg
X-Matched-Path=/icon.svg
Content-Type=image/svg+xml
Content-Length=747
Cache-Control=public, max-age=31536000, immutable
```
