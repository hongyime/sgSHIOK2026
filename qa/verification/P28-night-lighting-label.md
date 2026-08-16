# P28 Night Lighting Label

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=a9f8773f08661bcc300745210bd8f646b97dba98
REMOTE_MAIN=a9f8773f08661bcc300745210bd8f646b97dba98	refs/heads/main
STATUS_START
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
STATUS_END
```

## Objective And State

```text
OBJECTIVE_PATH=C:\Users\bryan\.codex\attachments\3cf757f3-21d9-4cd6-b777-58bf108c6f95\pasted-text-1.txt
OBJECTIVE_BYTES=7321
OBJECTIVE_LINES=1
OBJECTIVE_SHA256=E89090D88D1BB7BACB227DD01F1A26E927C4D87ECBED11D241D30881490BFFB3
```

## Credential Gate

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## Evidence Path Check

```text
EXIT_CODE=1
```

## Lamp Overlay Inspection

```text
web/app\page.tsx:1438:  const [lampOverlayEnabled, setLampOverlayEnabled] = useState(false);
web/app\page.tsx:1829:        showLampOverlay={lampOverlayEnabled}
web/app\page.tsx:1860:                className={`${styles.layerToggle} ${lampOverlayEnabled ? styles.layerToggleActive : ""}`}
web/app\page.tsx:1861:                aria-pressed={lampOverlayEnabled}
web/app\page.tsx:1862:                title="Shows lamp posts when zoomed in"
web/app\page.tsx:1866:                Lamp posts
web/lib/__tests__\route-evidence-map-interaction.test.ts:40:    expect(pageSource).toContain("lampOverlayEnabled");
web/lib/__tests__\route-evidence-map-interaction.test.ts:41:    expect(pageSource).toContain("showLampOverlay={lampOverlayEnabled}");
web/lib/__tests__\route-evidence-map-interaction.test.ts:42:    expect(pageSource).toContain("Lamp posts");
web/lib\__tests__\route-evidence-map-interaction.test.ts:40:    expect(pageSource).toContain("lampOverlayEnabled");
web/lib\__tests__\route-evidence-map-interaction.test.ts:41:    expect(pageSource).toContain("showLampOverlay={lampOverlayEnabled}");
web/lib\__tests__\route-evidence-map-interaction.test.ts:42:    expect(pageSource).toContain("Lamp posts");
web/lib/__tests__\score-card-copy.test.ts:38:    expect(source).toContain("Lamp posts");
web/lib\__tests__\score-card-copy.test.ts:38:    expect(source).toContain("Lamp posts");
```

## Focused Web Tests

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  11:58:35
   Duration  2.99s (transform 232ms, setup 0ms, import 293ms, tests 55ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts
```

## Full Web Test

First full-suite run timed out in an unrelated geometry-fetch test file. The same file passed alone, and the full suite passed on rerun.

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/geom-promoted-shard.test.ts (2 tests | 2 failed) 10071ms
     × falls back from a missing H3-8 parent shard to promoted child shards 5049ms
     × loads route geometry for postal-only lookup through the postal prefix shard index 5012ms

 Test Files  1 failed | 22 passed (23)
      Tests  2 failed | 110 passed (112)
   Start at  11:59:36
   Duration  27.81s (transform 21.40s, setup 0ms, import 50.61s, tests 44.44s, environment 25ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
stderr | lib/__tests__/geom-promoted-shard.test.ts
geom shard not found for cell parent-cell (postal 123456)


FAIL  lib/__tests__/geom-promoted-shard.test.ts > fetchGeomForPostal > falls back from a missing H3-8 parent shard to promoted child shards
Error: Test timed out in 5000ms.

FAIL  lib/__tests__/geom-promoted-shard.test.ts > fetchGeomForPostal > loads route geometry for postal-only lookup through the postal prefix shard index
Error: Test timed out in 5000ms.
```

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  12:00:41
   Duration  4.27s (transform 814ms, setup 0ms, import 726ms, tests 384ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/geom-promoted-shard.test.ts
```

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  112 passed (112)
   Start at  12:01:00
   Duration  10.81s (transform 8.35s, setup 0ms, import 10.13s, tests 14.61s, environment 19ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Weights Diff

```text
EXIT_CODE=0
```

## Pipeline Cost

```text
api_calls=0
scoring_runs=0
exports=0
rescores=0
subset_runs=0
ingest_runs=0
network_builds=0
public_data_writes=0
```

## FINDINGS

1. The next empirical OneMap measurement is still blocked by absent credentials in this environment, so P28 did not run API collection.
2. The lamp overlay was product-visible but labelled `Lamp posts`, which exposes the raw dataset rather than the intended night-lighting evidence layer.
3. The control is now user-facing as `Night lighting` while keeping source ids, layer ids, tile paths, and the `lamp_posts_v1` artifact contract unchanged.

## DISAGREEMENTS

1. None.
