# P602 Transit H3 Shard Builder

## Scope

Free-tier web helper and test change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Read-Only Public Artifact Check

```text
pois=6011
expected_cells=558
h3_files=558
shard_features=6011
wrong_cell_features=0
missing_id_features=0
missing_from_shards=0
extra_in_shards=0
```

## Change

`web/scripts/ensure-data-bundle.mjs` now exposes a pure `buildTransitH3ShardCollections()` helper and guards the CLI entry point with `fileURLToPath(import.meta.url) === process.argv[1]`. This lets tests import the shard derivation without executing the bundle download/derivation path or writing under `web/public/data`.

The new test pins the route-local transit POI shard contract used by `fetchTransitPoisForGeom()`: valid POIs are grouped by H3 res-8 cell, invalid coordinates are skipped, and shard provenance names `transit/pois.json`.

## Diff

```diff
diff --git a/web/scripts/ensure-data-bundle.mjs b/web/scripts/ensure-data-bundle.mjs
index 4851dba..c1acd1c 100644
--- a/web/scripts/ensure-data-bundle.mjs
+++ b/web/scripts/ensure-data-bundle.mjs
@@ -1,5 +1,6 @@
 import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
 import { basename, dirname, join } from "node:path";
+import { fileURLToPath } from "node:url";
 import { gunzipSync, gzipSync } from "node:zlib";
 import { latLngToCell } from "h3-js";
 
@@ -61,25 +62,34 @@ function writePostalPrefixShards(targetRoot, postalIndex) {
   }
 }
 
-function writeTransitH3Shards(targetRoot, transitPois) {
+export function buildTransitH3ShardCollections(transitPois, cellForLatLng = latLngToCell) {
   const cells = new Map();
   for (const feature of transitPois?.features || []) {
     const [lng, lat] = feature?.geometry?.coordinates || [];
     if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
-    const cell = latLngToCell(lat, lng, 8);
+    const cell = cellForLatLng(lat, lng, 8);
     if (!cells.has(cell)) cells.set(cell, []);
     cells.get(cell).push(feature);
   }
 
-  for (const [cell, features] of cells) {
-    writeGzJson(join(targetRoot, "transit", "h3", `${cell}.json.gz`), {
-      type: "FeatureCollection",
-      features,
-      provenance: {
-        source: "transit/pois.json",
-        h3_resolution: 8,
+  return new Map(
+    [...cells.entries()].map(([cell, features]) => [
+      cell,
+      {
+        type: "FeatureCollection",
+        features,
+        provenance: {
+          source: "transit/pois.json",
+          h3_resolution: 8,
+        },
       },
-    });
+    ])
+  );
+}
+
+function writeTransitH3Shards(targetRoot, transitPois) {
+  for (const [cell, collection] of buildTransitH3ShardCollections(transitPois)) {
+    writeGzJson(join(targetRoot, "transit", "h3", `${cell}.json.gz`), collection);
   }
 }
 
@@ -180,15 +190,21 @@ function ensureDerivedLookupShards(targetRoot) {
   writeTransitH3Shards(targetRoot, transitPois);
 }
 
-const bundle = normalizeBundle(process.argv[2] || process.env.SHIOK_DATA_BUNDLE || configuredBundle());
-const target = join(process.cwd(), "public", "data", bundle);
-const manifestPath = join(target, "manifest.json");
+async function main() {
+  const bundle = normalizeBundle(process.argv[2] || process.env.SHIOK_DATA_BUNDLE || configuredBundle());
+  const target = join(process.cwd(), "public", "data", bundle);
+  const manifestPath = join(target, "manifest.json");
+
+  if (existsSync(manifestPath)) {
+    console.log(`using local data bundle ${target}`);
+    ensureDerivedLookupShards(target);
+  } else {
+    await downloadRemoteBundle(bundle, target);
+    ensureDerivedLookupShards(target);
+    console.log(`downloaded data bundle ${target}`);
+  }
+}
 
-if (existsSync(manifestPath)) {
-  console.log(`using local data bundle ${target}`);
-  ensureDerivedLookupShards(target);
-} else {
-  await downloadRemoteBundle(bundle, target);
-  ensureDerivedLookupShards(target);
-  console.log(`downloaded data bundle ${target}`);
+if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
+  await main();
 }
```

## New Test File

```js
import { describe, expect, it, vi } from "vitest";

import { buildTransitH3ShardCollections } from "../../scripts/ensure-data-bundle.mjs";

describe("buildTransitH3ShardCollections", () => {
  it("groups transit POIs into H3 feature collections and skips invalid points", () => {
    const busStop = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [103.8, 1.3] },
      properties: { id: "bus:12345", kind: "bus_stop", name: "Test Stop" },
    };
    const mrtExit = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [103.81, 1.31] },
      properties: { id: "mrt:42", kind: "mrt_exit", name: "Test Exit" },
    };
    const invalid = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number.NaN, 1.32] },
      properties: { id: "bus:bad", kind: "bus_stop", name: "Bad Stop" },
    };
    const cellForLatLng = vi.fn((lat, lng, resolution) => {
      if (resolution !== 8) throw new Error(`unexpected resolution ${resolution}`);
      return lat < 1.31 || lng < 103.81 ? "cell-a" : "cell-b";
    });

    const shards = buildTransitH3ShardCollections(
      { type: "FeatureCollection", features: [busStop, mrtExit, invalid] },
      cellForLatLng
    );

    expect([...shards.keys()].sort()).toEqual(["cell-a", "cell-b"]);
    expect(shards.get("cell-a")).toEqual({
      type: "FeatureCollection",
      features: [busStop],
      provenance: { source: "transit/pois.json", h3_resolution: 8 },
    });
    expect(shards.get("cell-b")).toEqual({
      type: "FeatureCollection",
      features: [mrtExit],
      provenance: { source: "transit/pois.json", h3_resolution: 8 },
    });
    expect(cellForLatLng).toHaveBeenCalledTimes(2);
  });
});
```

## Verification

```text
> npm --prefix web test -- web/lib/__tests__/ensure-data-bundle.test.mjs
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/ensure-data-bundle.test.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/ensure-data-bundle.test.mjs
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text
> npm --prefix web test -- lib/__tests__/ensure-data-bundle.test.mjs
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/ensure-data-bundle.test.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  06:45:55
   Duration  7.98s (transform 2.38s, setup 0ms, import 2.84s, tests 92ms, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  152 passed (152)
   Start at  06:47:24
   Duration  56.20s (transform 6.41s, setup 0ms, import 13.12s, tests 18.60s, environment 11ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 64.70s (0:01:04)
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P602-transit-h3-shard-builder.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The protected public transit H3 shards are coherent under the browser contract: 558 expected cells, 558 shard files, 6,011 POI features, and zero wrong-cell or missing/extra ids.
2. The previous test invocation used a repository-relative path while Vitest filters from `web/`; the correct focused path is `lib/__tests__/ensure-data-bundle.test.mjs`.
3. The web test count moved from 151 to 152 because this change adds one focused shard-builder regression.

## DISAGREEMENTS

1. None.
