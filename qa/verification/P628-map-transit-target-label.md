# P628 Map Transit Target Label

## Root Guard

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, upstream API probe, deployment, public-data write, protected QA write, checksums write, or locked weights change was performed.
Changed files:
web/components/route-evidence-map.tsx
web/lib/__tests__/route-evidence-map-interaction.test.ts
qa/verification/P628-map-transit-target-label.md
```

## Search Output

```text
web/components/route-evidence-map.tsx:977:    return "Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and night lighting evidence";
web/lib/__tests__/route-evidence-map-interaction.test.ts:48:    expect(source).toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and night lighting evidence");
web/lib/__tests__/route-evidence-map-interaction.test.ts:49:    expect(source).not.toContain("Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit stops, and night lighting evidence");
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  09:51:11
   Duration  796ms (transform 297ms, setup 0ms, import 104ms, tests 287ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:51:20
   Duration  12.09s (transform 951ms, setup 0ms, import 1.83s, tests 3.30s, environment 4ms)
```

## Python Collect

```text
457 tests collected in 4.93s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Evidence Check Ignore

```text
exit=1
```

## Protected Path Diff

```text
exit=0
```

## Diff Stat

```text
 web/components/route-evidence-map.tsx                    | 2 +-
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
 2 files changed, 3 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The empty route-map accessible label still said `transit stops` even though the map and picker include MRT/LRT exits as transit choices. It now says `transit targets`, matching the settled target model without changing POI counts or map data.
2. The detailed POI count summary still names the actual feature classes, `MRT or LRT stations`, `exits`, and `bus stops`; that remains useful because it is an inventory, not a generic picker label.

## DISAGREEMENTS

1. None.
