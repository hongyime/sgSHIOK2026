# P832 Browser Stale Source Order

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
HEAD=fadd94a235d2f553d4ccd3ace8d2f11fefe9b15a
origin/main=fadd94a235d2f553d4ccd3ace8d2f11fefe9b15a
```

## Reason

The browser `Source freshness detail` text listed stale sources in an older topical order starting with Covered Linkway, while production readiness now exposes severity order by days past threshold. The user-facing disclosure should not make the least operationally urgent stale transport layer look like the first stale source to refresh.

## FINDINGS

1. Before P832, the browser freshness detail listed stale sources as `Covered Linkway, Pedestrian Overhead Bridge / Underpass, Traffic Signals, Planning Area Boundaries...`, while readiness severity order starts with `planning_area_boundary`.
2. The browser detail now says stale sources are ordered by days past threshold and starts with Planning Area Boundaries, NParks Tracks, NParks Heritage Road Green Buffers, and Traffic Signals.
3. This is copy-only. It does not change freshness thresholds, source manifests, scoring, exports, public data, deployment, or locked weights.

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  09:26:34
   Duration  1.38s (transform 307ms, setup 0ms, import 353ms, tests 236ms, environment 0ms)
```

## DISAGREEMENTS

1. None.
