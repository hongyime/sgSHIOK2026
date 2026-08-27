# P606 Data Test Timeout

## Scope

Free-tier web test reliability change only. No scoring, export CLI run, rescore, ingest, network build, public data write, or deployment was run.

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

The heavy generated-bundle manifest/index test in `web/lib/__tests__/data.test.ts` now has an explicit 15-second timeout. The assertions are unchanged.

P605 observed a full-suite failure where this test timed out at Vitest's default 5 seconds while reading the generated bundle under suite load; focused rerun passed. P606 makes the known-heavy test tolerate E14 I/O latency without weakening its checks.

## Diff

```diff
diff --git a/web/lib/__tests__/data.test.ts b/web/lib/__tests__/data.test.ts
index c8720e0..1680578 100644
--- a/web/lib/__tests__/data.test.ts
+++ b/web/lib/__tests__/data.test.ts
@@ -41,7 +41,7 @@ describe("generated data bundle", () => {
       manifest.provenance.state_counts.SCORED +
         manifest.provenance.state_counts.SCORED_PARTIAL
     );
-  });
+  }, 15000);
 
   it("score shards conform to the public score record shape", () => {
     const scoreIndex = readJson<Record<string, string[]>>("scores/index.json");
```

## Verification

```text
> npm --prefix web test -- lib/__tests__/data.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  07:18:16
   Duration  3.22s (transform 255ms, setup 0ms, import 314ms, tests 1.24s, environment 1ms)
```

```text
> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  155 passed (155)
   Start at  07:19:24
   Duration  71.16s (transform 3.04s, setup 0ms, import 5.37s, tests 36.17s, environment 11ms)
```

```text
> uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 32.76s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
> git check-ignore -v qa/verification/P606-data-test-timeout.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

```text
> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. The generated-bundle manifest/index test can exceed Vitest's default 5-second timeout under full-suite E14 load, as recorded in P605.
2. The test assertions remain unchanged; only the timeout for that known-heavy test is explicit now.
3. Web test count remains 155 and Python collection remains 457.

## DISAGREEMENTS

1. None.
