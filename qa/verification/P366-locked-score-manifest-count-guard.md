# P366 locked score manifest count guard

## Working root guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence path ignore check

```text
False
check_ignore_exit=1
```

## Change inspection

```text
diff --git a/web/lib/__tests__/data.test.ts b/web/lib/__tests__/data.test.ts
index 05b8ea1..5d4360b 100644
--- a/web/lib/__tests__/data.test.ts
+++ b/web/lib/__tests__/data.test.ts
@@ -3,6 +3,7 @@ import dataBundle from "../../data-bundle.json";
 import { existsSync, readFileSync } from "fs";
 import { gunzipSync } from "zlib";
 import { join } from "path";
+import { formatLockedScoreAvailabilityLine } from "../locked-score-availability";
 
 const DATA_DIR = join(__dirname, "../../public/data", dataBundle.bundle);
 
@@ -23,6 +24,18 @@ describe("generated data bundle", () => {
     expect(manifest.provenance).toEqual(
       expect.objectContaining({ record_count: 124443 })
     );
+    expect(manifest.provenance.state_counts).toEqual({
+      NO_TRANSIT_IN_RANGE: 9827,
+      NOT_YET_SCORED: 476,
+      SCORED: 95157,
+      SCORED_PARTIAL: 18983,
+    });
+    expect(
+      Object.values(manifest.provenance.state_counts).reduce((total, count) => total + count, 0)
+    ).toBe(manifest.provenance.record_count);
+    expect(formatLockedScoreAvailabilityLine(manifest)).toBe(
+      "Locked score availability: 95,157 full locked scores out of 124,443; 29,286 records (23.5%, roughly a quarter) do not show a full locked score: 18,983 with partial shelter-map evidence, 9,827 beyond locked transit range, and 476 awaiting scoring."
+    );
     expect(Object.keys(scoreIndex).length).toBeGreaterThan(50);
     expect(Object.keys(geomPostalIndex).length).toBe(
       manifest.provenance.state_counts.SCORED +
```

## Verification output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/data.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  15:01:38
   Duration  940ms (transform 88ms, setup 0ms, import 117ms, tests 326ms, environment 0ms)
```

```text
repo_integrity=ok
repo_integrity_exit=0
```

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. The first-view locked-score availability helper was covered by a synthetic fixture, but the generated-data test did not pin the actual configured bundle state counts or prove that the visible disclosure is derived from the real manifest.

## DISAGREEMENTS

1. None.
