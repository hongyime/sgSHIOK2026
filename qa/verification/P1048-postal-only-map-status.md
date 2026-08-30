# P1048 Postal-Only Search And Map Status

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

No scoring, export, rescore, subset run, ingest, network build, input rebuild, protected payload mutation, or `pipeline/config/weights.yaml` edit was performed.

## Change

The search box now accepts only six digits and no longer sends address text to OneMap Search. The page also shows a compact visible map status after a postal loads:

```text
Map waiting
Map hidden
Map starting
Map loading
Map ready
Map failed: <message>
```

## Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  3 passed (3)
      Tests  73 passed (73)
   Start at  20:59:13
   Duration  23.85s (transform 10.49s, setup 0ms, import 12.85s, tests 3.87s, environment 2ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  25 passed (25)
      Tests  215 passed (215)
   Start at  21:00:45
   Duration  81.30s (transform 3.41s, setup 0ms, import 10.13s, tests 34.85s, environment 20ms)

repo_integrity=ok
repo_integrity_exit=0
```

## Visual Smoke

The first local smoke attempt reached the page but timed out during Chrome screenshot capture. A retry with a longer timeout passed:

```text
npm --prefix web run qa:browser -- --url http://127.0.0.1:3001/ --postal 018956 --input-mode keyboard --screenshots --debug-port 9246 --timeout-ms 180000 --out ../qa/debug-runs/p1048-postal-map-status-retry/summary.json
ok=true
no_uncaught_page_errors=true
route_network_ok=true
route_source_features_present=true
route_rendered_features_present=true
map_label=Shelter-map view for Postal 018956, showing sheltered walk
map_summary=Shelter-map view for Postal 018956. Showing 4 sheltered-walk segments, 3 exposed gaps, and 7 MRT or LRT stations, 34 exits, and 27 bus stops.
map_status_visible=Map ready
screenshots=C:\sgSHIOK2026\qa\debug-runs\p1048-postal-map-status-retry\screenshots\summary_desktop.png, C:\sgSHIOK2026\qa\debug-runs\p1048-postal-map-status-retry\screenshots\summary_mobile.png, C:\sgSHIOK2026\qa\debug-runs\p1048-postal-map-status-retry\screenshots\summary_mobile_short.png
```

Local Next dev rendered a red development-only issue badge because the app CSP blocks development-mode eval:

```text
[browser] eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment.
React will never use eval() in production mode
```

## FINDINGS

1. The visible search UI still exposed address search even after the app had become postal-code-first.
2. A user had no visible map load state unless they opened DevTools; the new status pill makes stuck states screenshot-reportable.
3. Local development mode shows a CSP/eval issue badge that does not apply to production mode.

## DISAGREEMENTS

1. I do not think address search belongs in the default UI while Vercel Edge requests are constrained; postal-only search is cheaper, clearer, and avoids accidental personal-address disclosure.
