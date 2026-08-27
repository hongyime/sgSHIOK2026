# P604 Geometry Prefix Fallback

## Scope

Free-tier web test change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

The browser already falls back from `geom/postal-prefix/{prefix}.json` to the full `geom/postal-index.json` when the prefix shard points to a route shard that does not contain the requested postal. P604 pins that behavior with a focused test.

This matters because prefix shards are derived lookup accelerators. If a derived prefix shard is stale, it must not block a user from loading the route geometry when the authoritative full postal index still resolves it.

## Diff

```diff
diff --git a/web/lib/__tests__/geom-promoted-shard.test.ts b/web/lib/__tests__/geom-promoted-shard.test.ts
index e4932b2..7767f00 100644
--- a/web/lib/__tests__/geom-promoted-shard.test.ts
+++ b/web/lib/__tests__/geom-promoted-shard.test.ts
@@ -101,4 +101,50 @@ describe("fetchGeomForPostal", () => {
       { cache: "no-store" }
     );
   });
+
+  it("falls back to the full postal index when the postal prefix shard is stale", async () => {
+    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
+    const childRecord = {
+      postal: "560234",
+      shortest: "encoded-shortest",
+      sheltered: "encoded-sheltered",
+      exposure_gaps: [],
+    };
+
+    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
+      const url = bareUrl(input);
+      if (url.endsWith("/geom/postal-prefix/560.json")) {
+        return jsonResponse(true, { "560234": "stale-child" });
+      }
+      if (url.endsWith("/geom/h3/stale-child.json")) {
+        return jsonResponse(true, [{ ...childRecord, postal: "560999" }]);
+      }
+      if (url.endsWith("/geom/postal-index.json")) {
+        return jsonResponse(true, { "560234": "postal-child" });
+      }
+      if (url.endsWith("/geom/h3/postal-child.json")) return jsonResponse(true, [childRecord]);
+      return jsonResponse(false);
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    const { fetchGeomForPostal } = await import("../data");
+
+    await expect(fetchGeomForPostal("560234")).resolves.toEqual(childRecord);
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/geom\/postal-prefix\/560\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/geom\/h3\/stale-child\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/geom\/postal-index\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/geom\/h3\/postal-child\.json\?v=/),
+      { cache: "no-store" }
+    );
+  });
 });
```

## Verification

```text
> npm --prefix web test -- lib/__tests__/geom-promoted-shard.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/geom-promoted-shard.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  06:59:30
   Duration  6.19s (transform 1.33s, setup 0ms, import 1.11s, tests 692ms, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  154 passed (154)
   Start at  07:00:34
   Duration  75.99s (transform 2.33s, setup 0ms, import 5.57s, tests 25.56s, environment 14ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 31.11s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P604-geom-prefix-fallback.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The browser geometry lookup is resilient to a stale derived postal-prefix shard: it checks the full `geom/postal-index.json` fallback and can still recover the route geometry.
2. This was existing production behavior but was previously unpinned by tests.
3. Web tests moved from 153 to 154 because this change adds one focused browser data-fetch regression; Python collection remains 457.

## DISAGREEMENTS

1. None.
