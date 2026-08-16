# P22 Lamp Map Layer Evidence

## Root And Head

```text
C:\sgSHIOK2026
Prawn-E14
8dd49a42167e4bfe7353f899ad3cbb5033abf7e5
8dd49a42167e4bfe7353f899ad3cbb5033abf7e5	refs/heads/main
 M web/app/page.module.css
 M web/app/page.tsx
 M web/components/route-evidence-map.tsx
 M web/lib/__tests__/route-evidence-map-interaction.test.ts
 M web/lib/__tests__/score-card-copy.test.ts
 M web/lib/__tests__/typescript-contract.test.ts
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
?? web/lib/__tests__/lamp-overlay.test.ts
?? web/lib/lamp-overlay.ts
```

## Lamp Artifact Build

Command:

```text
uv run python run.py lamp-overlay --output web/public/data/lamp_posts_v1 --h3-resolution 8
```

Output:

```text
{"h3_resolution": 8, "manifest_bytes": 120620, "manifest_path": "web\\public\\data\\lamp_posts_v1\\manifest.json", "ok": true, "output_dir": "web\\public\\data\\lamp_posts_v1", "point_count": 126144, "skipped_feature_count": 0, "tile_bytes": 3026077, "tile_count": 700, "total_bytes": 3146697}
exit=0
elapsed_seconds=6.883
file_count=701
total_bytes=3146697
manifest_sha256=3e28d94c90cfdd03a72d26cc0cf9a3a4f37657e650b6ae94d8de2505124a9512
```

## Artifact And Evidence Ignore Checks

```text
evidence_check_ignore_exit=1
.gitignore:30:web/public/data/	"web\\public\\data\\lamp_posts_v1\\manifest.json"
lamp_artifact_check_ignore_exit=0
```

## Focused Web Tests

Command:

```text
npm --prefix web test -- --run lib/__tests__/lamp-overlay.test.ts lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/score-card-copy.test.ts
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  17 passed (17)
   Start at  10:42:11
   Duration  860ms (transform 209ms, setup 0ms, import 364ms, tests 79ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/lamp-overlay.test.ts lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/score-card-copy.test.ts
```

## TypeScript Check

Command:

```text
node web\node_modules\typescript\bin\tsc --project web\tsconfig.json --noEmit --pretty false
```

Output:

```text
exit=0
```

## Full Web Test, First Run

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/typescript-contract.test.ts (1 test | 1 failed) 13590ms
     × type-checks rank payload projections 13581ms

 Test Files  1 failed | 21 passed (22)
      Tests  1 failed | 108 passed (109)
   Start at  10:43:14
   Duration  19.75s (transform 8.54s, setup 0ms, import 14.99s, tests 20.57s, environment 34ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/typescript-contract.test.ts > typescript contracts > type-checks rank payload projections
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/typescript-contract.test.ts:6:3
      4|
      5| describe("typescript contracts", () => {
      6|   it("type-checks rank payload projections", () => {
       |   ^
      7|     const webRoot = join(__dirname, "../..");
      8|     const tscBin = join(webRoot, "node_modules", "typescript", "bin", …

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

## Full Web Test, After Typecheck Timeout Fix

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  22 passed (22)
      Tests  109 passed (109)
   Start at  10:44:09
   Duration  8.80s (transform 4.92s, setup 0ms, import 7.64s, tests 8.38s, environment 13ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

## Next Production Build

```text
using local data bundle C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 70ms

  Creating an optimized production build ...
✓ Compiled successfully in 53s
  Running TypeScript ...
  Finished TypeScript in 9.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/6) ...
  Generating static pages using 7 workers (1/6) 
  Generating static pages using 7 workers (2/6) 
  Generating static pages using 7 workers (4/6) 
✓ Generating static pages using 7 workers (6/6) in 11.5s
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

npm notice run shiok-web@0.1.0 build
npm notice run node scripts/ensure-data-bundle.mjs && next build
```

## Repository Integrity And Diff Checks

```text
repo_integrity=ok
exit=0
```

```text
exit=0
weights_diff_exit=0
```

## FINDINGS

1. The lamp source is now product-visible as an optional `Lamp posts` map overlay. It is not a scoring input, does not change route selection, and does not change the locked score bundle.
2. The generated browser artifact is local, versioned, and ignored by git at `web/public/data/lamp_posts_v1/`: 701 files, 3,146,697 bytes, 126,144 points, 700 H3-r8 tiles, manifest sha256 `3e28d94c90cfdd03a72d26cc0cf9a3a4f37657e650b6ae94d8de2505124a9512`.
3. The full web suite now has 109 tests across 22 files. The count moved from 108/21 because P22 added `web/lib/__tests__/lamp-overlay.test.ts`.
4. `web/lib/__tests__/typescript-contract.test.ts` was not testing a different contract failure; it was shelling out to the full TypeScript compiler under Vitest's default 5 second timeout. Direct `tsc` passed, and the suite passed after raising that one test timeout to 30 seconds.
5. The local lamp artifact will not appear in a fresh GitHub clone because `web/public/data/` is ignored. Publishing the overlay requires deploying or uploading from this local working copy, or explicitly adding a separate artifact distribution step.

## DISAGREEMENTS

1. None.
