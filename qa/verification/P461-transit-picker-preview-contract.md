# P461 Transit Picker Preview Contract

Root and host:

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

Scope:

```text
Updated web source comments and tests only.
No runtime behavior change, API call, scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or locked-weights change.
```

Finding scan:

```text
web\lib\nearest-transit.ts:12: *   - The map route line stays on the auto-picked best_transit stop.
web\app\page.tsx:617:  // 1. If we already have a live OneMap-snapped preview route for this stop, return it.
web\app\page.tsx:630:  // 2. If pre-computed candidate geometry exists in the shard, use it!
web\app\page.tsx:680:  // 3. Fallback: show shelter map evidence only while OneMap loads in background.
web\app\page.tsx:1805:  // Background fetch to snap arbitrary clicked stops onto real OneMap sidewalks for preview evidence.
```

Focused tests:

```text
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/transit-stop-picker.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  43 passed (43)
   Start at  23:20:31
   Duration  1.40s (transform 904ms, setup 0ms, import 904ms, tests 607ms, environment 1ms)
```

Evidence path ignore check:

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P461-transit-picker-preview-contract.md
EXIT=1
```

Repository integrity:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

Protected path diff check:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

FINDINGS:

1. `web/lib/nearest-transit.ts` still said the map route line stays on the auto-picked best transit stop.
2. That statement is stale: current selected-stop code can use precomputed candidate geometry or a live OneMap preview after selection.
3. The corrected source contract keeps the important limitation: chip comparisons remain straight-line only until selected-stop evidence is available.

DISAGREEMENTS:

1. None.
