# P945 Lazy Transit POI Load

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Reduce first-load Vercel Edge/CDN requests by avoiding initial fetches that are only needed after a postal selection.

## Transit POI Request Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1945:  const [baseTransitPois, setBaseTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
C:\sgSHIOK2026\web\app\page.tsx:1946:  const [routeTransitPois, setRouteTransitPois] = useState<TransitPoiCollection>({ type: "FeatureCollection", features: [] });
C:\sgSHIOK2026\web\app\page.tsx:2026:  const mapTransitPois = routeTransitPois.features.length > 0 ? routeTransitPois : baseTransitPois;
C:\sgSHIOK2026\web\app\page.tsx:2172:    void fetchTransitPois().then((pois) => {
C:\sgSHIOK2026\web\app\page.tsx:2173:      if (active) setBaseTransitPois(pois);
C:\sgSHIOK2026\web\app\page.tsx:2191:    setRouteTransitPois({ type: "FeatureCollection", features: [] });
C:\sgSHIOK2026\web\app\page.tsx:2203:      setRouteTransitPois(nearbyTransitPois);
C:\sgSHIOK2026\web\lib\__tests__\transit-shards.test.ts:88:    const pois = await fetchTransitPois();
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  18:37:37
   Duration  1.79s (transform 669ms, setup 0ms, import 236ms, tests 632ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  180 passed (180)
   Start at  18:38:02
   Duration  72.31s (transform 4.94s, setup 0ms, import 8.28s, tests 34.72s, environment 20ms)
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Locked Weights Diff

```text
```

## Diff Check

```text
```

## FINDINGS

1. The page fetched the island-wide transit POI file during initial mount even before any postal was selected.
2. Initial mount now fetches only the manifest; the island-wide transit POI file is loaded only as a fallback after route-local transit shards return no features for a selected postal.
3. This removes one first-load static data request for visitors who land on the app but do not search/select a postal.
4. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. This is a small request-count reduction, not a substitute for deploying the cache/header changes and measuring Vercel usage.
