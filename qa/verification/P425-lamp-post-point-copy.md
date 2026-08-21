# P425 lamp-post point copy evidence

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
C:\sgSHIOK2026\web\app\page.tsx:1045:          LTA lamp-post points
C:\sgSHIOK2026\web\app\page.tsx:1238:      "Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads points only after you zoom into a neighbourhood."
C:\sgSHIOK2026\web\app\page.tsx:2160:              Night lighting layer: 126,144 LTA lamp-post points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score.
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:995:    return `Night lighting overlay is on; zoom in to load LTA lamp-post points. ${caveat}`;
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:998:    return `Night lighting overlay is on; LTA lamp-post points are loading for the current map view. ${caveat}`;
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:1004:    return `Night lighting overlay is on; no lamp-post points are indexed in the current map view. ${caveat}`;
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:1006:  return `Night lighting overlay is on with ${lampCount} lamp-post point${
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:560:    expect(html).toContain("LTA lamp-post points");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:561:    expect(html).not.toContain("LTA lamp points");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:89:    expect(pageSource).toContain("LTA lamp-post points");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:90:    expect(pageSource).not.toContain("LTA lamp points");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:116:      "Night lighting overlay is on; no lamp-post points are indexed in the current map view. Map evidence only; not part of the locked score."
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:122:      "Night lighting overlay is on with 1 lamp-post point in view. Map evidence only; not part of the locked score."
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:125:      "Night lighting overlay is on with 14 lamp-post points in view. Map evidence only; not part of the locked score."
```

## Verification

```text
npm --prefix C:\sgSHIOK2026\web test -- accessibility-render.test.tsx route-evidence-map-interaction.test.ts --runInBand
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx route-evidence-map-interaction.test.ts --runInBand

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  33 passed (33)
   Start at  20:11:43
   Duration  3.32s (transform 1.83s, setup 0ms, import 1.86s, tests 1.58s, environment 1ms)
```

```text
git -C C:\sgSHIOK2026 check-ignore -v -- C:\sgSHIOK2026\qa\verification\P425-lamp-post-point-copy.md
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

1. The night-lighting visible legend said `LTA lamp points` while the layer note, metadata, and README use `LTA lamp-post points`.
2. The non-visual night-lighting summaries also said `lamp point(s)` for empty and loaded states, even though the source is specifically LTA lamp-post points.

## DISAGREEMENTS

1. None.
