# P607 Score Prefix Index Coherence

## Scope

Free-tier web generated-bundle test change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Read-Only Public Artifact Check

```text
score_shards=304
score_postal_refs=124443
expected_prefixes=542
prefix_index_prefixes=542
mismatched_prefixes=0
prefix_index_matches=true
```

## Change

`web/lib/__tests__/data.test.ts` now verifies that `scores/prefix-index.json` exactly matches the prefix-to-score-shard mapping derived from `scores/index.json`.

The browser uses the prefix index as its first score lookup accelerator. P605 pinned fallback behavior when the prefix index is stale; P607 pins the generated bundle contract that the accelerator is coherent in the current public bundle.

## Diff

```diff
diff --git a/web/lib/__tests__/data.test.ts b/web/lib/__tests__/data.test.ts
index 1680578..1062d67 100644
--- a/web/lib/__tests__/data.test.ts
+++ b/web/lib/__tests__/data.test.ts
@@ -70,6 +70,28 @@ describe("generated data bundle", () => {
     );
   });
 
+  it("score prefix index matches the score shard index", () => {
+    const scoreIndex = readJson<Record<string, string[]>>("scores/index.json");
+    const scorePrefixIndex = readJson<Record<string, string[]>>("scores/prefix-index.json");
+    const expectedPrefixIndex: Record<string, string[]> = {};
+    for (const [shard, postals] of Object.entries(scoreIndex)) {
+      for (const postal of postals) {
+        const prefix = postal.slice(0, 3);
+        expectedPrefixIndex[prefix] ??= [];
+        if (!expectedPrefixIndex[prefix].includes(shard)) {
+          expectedPrefixIndex[prefix].push(shard);
+        }
+      }
+    }
+    for (const shards of Object.values(expectedPrefixIndex)) {
+      shards.sort();
+    }
+
+    expect(scorePrefixIndex).toEqual(
+      Object.fromEntries(Object.entries(expectedPrefixIndex).sort())
+    );
+  });
+
   it("postal geometry index resolves a route shard", () => {
     const geomPostalIndex = readJson<Record<string, string>>("geom/postal-index.json");
     const shard = geomPostalIndex["560234"];
```

## Verification

```text
> npm --prefix web test -- lib/__tests__/data.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  07:24:08
   Duration  5.82s (transform 403ms, setup 0ms, import 492ms, tests 2.68s, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  156 passed (156)
   Start at  07:25:31
   Duration  79.79s (transform 3.55s, setup 0ms, import 6.48s, tests 36.71s, environment 19ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 18.82s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P607-score-prefix-index-coherence.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The protected public score prefix index is coherent with `scores/index.json`: 304 score shards, 124,443 postal references, 542 expected prefixes, 542 prefix-index prefixes, zero mismatches.
2. The generated-bundle web test now pins that score lookup accelerator contract directly.
3. Web tests moved from 155 to 156 because this change adds one focused generated-bundle regression; Python collection remains 457.

## DISAGREEMENTS

1. None.
