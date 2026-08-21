# P426 lamp-post zoom copy evidence

## Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, or public-data write was run.
Protected files and directories were not intentionally modified.
```

## Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1235:      value: lampOverlayEnabled ? "Map layer on; zoom in for lamp-post points" : "Map layer off",
C:\sgSHIOK2026\web\app\page.tsx:1238:      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
C:\sgSHIOK2026\web\app\page.tsx:2160:              Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score.
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:559:    expect(html).toContain("Map layer on; zoom in for lamp-post points");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:562:    expect(html).not.toContain("Map layer on; zoom in for points");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:565:      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:100:      "Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:239:      "Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load lamp-post points. Map evidence only; not part of the locked score."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:339:    expect(tsxSource).toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for lamp-post points" : "Map layer off",');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:340:    expect(tsxSource).not.toContain('value: lampOverlayEnabled ? "Map layer on; zoom in for points" : "Map layer off",');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:345:      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood."
```

## Verification

```text
npm --prefix C:\sgSHIOK2026\web test -- accessibility-render.test.tsx score-card-copy.test.ts route-evidence-map-interaction.test.ts --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts route-evidence-map-interaction.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  49 passed (49)
   Start at  20:16:24
   Duration  3.92s (transform 2.29s, setup 0ms, import 2.84s, tests 2.06s, environment 2ms)
```

```text
git -C C:\sgSHIOK2026 check-ignore -v -- C:\sgSHIOK2026\qa\verification\P426-lamp-post-zoom-copy.md
EXIT=1
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

```text
git -C C:\sgSHIOK2026 diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

## FINDINGS

1. After P425, the night-lighting legend named `LTA lamp-post points`, but the detail strip still said `zoom in for points` and the layer note still said `load points`.
2. The detail strip and layer note now use `lamp-post points`, matching the LTA source-specific wording across visible and non-visual night-lighting copy.

## DISAGREEMENTS

1. None.
