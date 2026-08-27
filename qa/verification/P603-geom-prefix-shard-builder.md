# P603 Geometry Postal Prefix Shard Builder

## Scope

Free-tier web helper and test change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Read-Only Public Artifact Check

```text
postal_index_entries=114140
expected_prefixes=523
prefix_files=523
prefix_entries=114140
missing_prefix_files=0
extra_prefix_files=0
mismatched_prefix_files=0
```

## Change

`web/scripts/ensure-data-bundle.mjs` now exposes a pure `buildPostalPrefixShardMappings()` helper used by `writePostalPrefixShards()`. The browser calls `fetchGeomForPostal()` -> `getGeomPostalPrefixIndex()` before falling back to the full `geom/postal-index.json`, so this pins the derived prefix-shard contract used for postal-to-geometry lookup.

## Diff

```diff
diff --git a/web/lib/__tests__/ensure-data-bundle.test.mjs b/web/lib/__tests__/ensure-data-bundle.test.mjs
index 316a98b..9abacbb 100644
--- a/web/lib/__tests__/ensure-data-bundle.test.mjs
+++ b/web/lib/__tests__/ensure-data-bundle.test.mjs
@@ -1,6 +1,28 @@
 import { describe, expect, it, vi } from "vitest";
 
-import { buildTransitH3ShardCollections } from "../../scripts/ensure-data-bundle.mjs";
+import {
+  buildPostalPrefixShardMappings,
+  buildTransitH3ShardCollections,
+} from "../../scripts/ensure-data-bundle.mjs";
+
+describe("buildPostalPrefixShardMappings", () => {
+  it("groups postal-to-geometry shard mappings by first three postal digits", () => {
+    const shards = buildPostalPrefixShardMappings({
+      "018989": "cell-a",
+      "018990": "cell-b",
+      "238801": "cell-c",
+    });
+
+    expect([...shards.keys()].sort()).toEqual(["018", "238"]);
+    expect(shards.get("018")).toEqual({
+      "018989": "cell-a",
+      "018990": "cell-b",
+    });
+    expect(shards.get("238")).toEqual({
+      "238801": "cell-c",
+    });
+  });
+});
 
 describe("buildTransitH3ShardCollections", () => {
   it("groups transit POIs into H3 feature collections and skips invalid points", () => {
diff --git a/web/scripts/ensure-data-bundle.mjs b/web/scripts/ensure-data-bundle.mjs
index c1acd1c..c8ef2a8 100644
--- a/web/scripts/ensure-data-bundle.mjs
+++ b/web/scripts/ensure-data-bundle.mjs
@@ -49,15 +49,18 @@ function ensureGzipCompanion(path) {
   writeFileSync(`${path}.gz`, gzipSync(readFileSync(path)));
 }
 
-function writePostalPrefixShards(targetRoot, postalIndex) {
+export function buildPostalPrefixShardMappings(postalIndex) {
   const prefixes = new Map();
   for (const [postal, shard] of Object.entries(postalIndex || {})) {
     const prefix = String(postal).slice(0, 3);
     if (!prefixes.has(prefix)) prefixes.set(prefix, {});
     prefixes.get(prefix)[postal] = shard;
   }
+  return prefixes;
+}
 
-  for (const [prefix, mapping] of prefixes) {
+function writePostalPrefixShards(targetRoot, postalIndex) {
+  for (const [prefix, mapping] of buildPostalPrefixShardMappings(postalIndex)) {
     writeGzJson(join(targetRoot, "geom", "postal-prefix", `${prefix}.json.gz`), mapping);
   }
 }
```

## Verification

```text
> npm --prefix web test -- lib/__tests__/ensure-data-bundle.test.mjs
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/ensure-data-bundle.test.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  06:54:34
   Duration  2.85s (transform 441ms, setup 0ms, import 853ms, tests 63ms, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  153 passed (153)
   Start at  06:55:23
   Duration  38.92s (transform 2.26s, setup 0ms, import 4.48s, tests 12.35s, environment 11ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 19.86s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P603-geom-prefix-shard-builder.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The protected public geometry prefix shards are coherent with `geom/postal-index.json`: 114,140 postal-index entries, 523 expected prefixes, 523 files, zero missing/extra/mismatched prefix files.
2. The browser already relies on `geom/postal-prefix/{prefix}.json` before the full postal index fallback, so the derived prefix-shard contract is now unit-covered.
3. Web tests moved from 152 to 153 because this change adds one focused helper regression; Python collection remains 457.

## DISAGREEMENTS

1. None.
