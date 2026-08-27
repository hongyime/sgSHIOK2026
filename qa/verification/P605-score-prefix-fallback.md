# P605 Score Prefix Fallback

## Scope

Free-tier web test change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

The browser already falls back from `scores/prefix-index.json` to the full `scores/index.json` when the prefix index points to a score shard that does not contain the requested postal. P605 pins that behavior with a focused test.

This matters because `scores/prefix-index.json` is a derived lookup accelerator. If it becomes stale, it must not hide a valid score record that the authoritative full score index can still locate.

## Diff

```diff
diff --git a/web/lib/__tests__/score-prefix-index.test.ts b/web/lib/__tests__/score-prefix-index.test.ts
index c28569d..4dd241c 100644
--- a/web/lib/__tests__/score-prefix-index.test.ts
+++ b/web/lib/__tests__/score-prefix-index.test.ts
@@ -51,4 +51,51 @@ describe("fetchScoreForPostal", () => {
       { cache: "no-store" }
     );
   });
+
+  it("falls back to the full score index when the score prefix index is stale", async () => {
+    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
+    const scoreRecord = {
+      postal: "560234",
+      state: "SCORED",
+      total: 72,
+    };
+
+    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
+      const url = bareUrl(input);
+      if (url.endsWith("/scores/prefix-index.json")) {
+        return jsonResponse(true, { "560": ["STALE_AREA"] });
+      }
+      if (url.endsWith("/scores/STALE_AREA.json")) {
+        return jsonResponse(true, [{ ...scoreRecord, postal: "560999" }]);
+      }
+      if (url.endsWith("/scores/index.json")) {
+        return jsonResponse(true, { STALE_AREA: ["560999"], ANG_MO_KIO: ["560234"] });
+      }
+      if (url.endsWith("/scores/ANG_MO_KIO.json")) {
+        return jsonResponse(true, [scoreRecord]);
+      }
+      return jsonResponse(false);
+    });
+    vi.stubGlobal("fetch", fetchMock);
+
+    const { fetchScoreForPostal } = await import("../data");
+
+    await expect(fetchScoreForPostal("560234")).resolves.toEqual(scoreRecord);
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/scores\/prefix-index\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/scores\/STALE_AREA\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/scores\/index\.json\?v=/),
+      { cache: "no-store" }
+    );
+    expect(fetchMock).toHaveBeenCalledWith(
+      expect.stringMatching(/^\/data\/generated\/scores\/ANG_MO_KIO\.json\?v=/),
+      { cache: "no-store" }
+    );
+  });
 });
```

## Verification

```text
> npm --prefix web test -- lib/__tests__/score-prefix-index.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-prefix-index.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  07:07:16
   Duration  4.61s (transform 616ms, setup 0ms, import 453ms, tests 553ms, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/data.test.ts (3 tests | 1 failed) 9974ms
     × has the expected manifest and indexes 6635ms

 FAIL  lib/__tests__/data.test.ts > generated data bundle > has the expected manifest and indexes
Error: Test timed out in 5000ms.

 Test Files  1 failed | 23 passed (24)
      Tests  1 failed | 154 passed (155)
   Start at  07:08:54
   Duration  177.42s (transform 6.31s, setup 0ms, import 10.45s, tests 83.65s, environment 197ms)
```

```text
> npm --prefix web test -- lib/__tests__/data.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  07:12:15
   Duration  2.45s (transform 210ms, setup 0ms, import 260ms, tests 999ms, environment 0ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  155 passed (155)
   Start at  07:12:40
   Duration  100.22s (transform 4.01s, setup 0ms, import 6.73s, tests 62.09s, environment 21ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 31.68s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P605-score-prefix-fallback.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The browser score lookup is resilient to a stale derived score prefix index: it checks the full `scores/index.json` fallback and can still recover the score record.
2. This was existing production behavior but was previously unpinned by tests.
3. The first full web run hit a transient 5-second timeout in `lib/__tests__/data.test.ts`; the focused rerun passed and the full suite rerun passed with 155 tests.
4. Web tests moved from 154 to 155 because this change adds one focused browser data-fetch regression; Python collection remains 457.

## DISAGREEMENTS

1. None.
