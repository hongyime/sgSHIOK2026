# P456 Named DataMall Discovery Copy

## Root And Host

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Scope

Changed the first-view DataMall discovery caveat from vague `shelter-layer`
wording to the measured layer names: Covered Linkway and bridge/underpass.
No scoring, export, rescore, subset run, ingest, network build, payload fetch,
public data write, or deployment was run.

## Measurement Basis

The prior P455 safe discovery-only report measured:

```text
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 1, changed 2, errors 0
```

## Focused Web Test

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  22:36:14
   Duration  840ms (transform 107ms, setup 0ms, import 132ms, tests 199ms, environment 0ms)
```

## FINDINGS

1. P455's first-view copy said `shelter-layer discovery URLs`, but the measured report was more specific: Covered Linkway and pedestrian bridge/underpass changed, while traffic signals matched.
2. The browser now names current Covered Linkway and bridge/underpass discovery URLs as differing from frozen v1.
3. This is a copy/test clarification only; the frozen v1 input remains untouched.

## DISAGREEMENTS

1. None.
