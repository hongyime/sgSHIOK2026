# P186 Walk-Mode QA Aliases

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
check_ignore_exit=1
```

## Finding

The user-facing control and feedback action now say `Walk display` and `Copy walk QA JSON`, but copied QA payloads and browser-smoke summaries still exposed only route-mode field names. P186 adds walk-mode aliases while keeping the older route-mode keys for compatibility with existing launch checks and historical tooling.

## Evidence

```text
C:\sgSHIOK2026\web\app\page.tsx:818:    walk_mode: routeMode,
C:\sgSHIOK2026\web\app\page.tsx:819:    route_mode: routeMode,
C:\sgSHIOK2026\web\app\page.tsx:1301:                Copy walk QA JSON
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:47:    expect(script).toContain("walk_mode_selected");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:48:    expect(script).toContain("route_mode_selected");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:49:    expect(script).toContain("active_walk_mode");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:65:    expect(source).toContain("Copy walk QA JSON");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:66:    expect(source).toContain("walk_mode: routeMode");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:67:    expect(source).toContain("route_mode: routeMode");
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:618:    walk_mode_selected:
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:622:    route_mode_selected:
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:715:    walk_mode: args.routeMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:716:    route_mode: args.routeMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:724:    active_walk_mode: summary.activeRouteMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:725:    active_route_mode: summary.activeRouteMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:780:      walk_mode: args.routeMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:781:      route_mode: args.routeMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:795:      walk_mode: args.routeMode,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:796:      route_mode: args.routeMode,
```

## Scope

This changes copied QA/browser-smoke metadata only. It does not change route selection, app rendering, scoring, export, input artifacts, public data, deployment, or `pipeline/config/weights.yaml`.

## FINDINGS

1. `Copy walk QA JSON` still produced only `route_mode`, so the copied diagnostic payload lagged the user-facing walk terminology.
2. Browser smoke now reports `walk_mode`, `active_walk_mode`, and `walk_mode_selected` while preserving `route_mode`, `active_route_mode`, and `route_mode_selected`.

## DISAGREEMENTS

1. None.
