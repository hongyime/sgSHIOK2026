# P130 Shelter Source Labels

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The route source strip now uses shelter-evidence labels instead of internal source-class copy:

- `LTA covered linkway`
- `OSM shelter tags`
- `HDB void-deck inference`
- `Mapped shelter`

The strip's accessible name is now `Shelter source evidence`.

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:11:27
   Duration  8.66s (transform 4.90s, setup 0ms, import 6.82s, tests 12.30s, environment 14ms)
```

## Diff Guards

```text
git diff --check
```

No output.

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. The source strip previously surfaced labels such as `OSM covered` and generic `Covered`, which were closer to internal source classes than product-facing shelter evidence.
2. The rendered fixture now includes route segments, so browser output tests assert the actual labels users see instead of only scanning source text.
3. This is browser copy and test coverage only. It does not alter route classification, map styling, route geometry, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
