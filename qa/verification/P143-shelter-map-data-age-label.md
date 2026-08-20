# P143 Shelter Map Data Age Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The title-card data-age line now says:

```text
Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:52:17
   Duration  16.85s (transform 9.05s, setup 0ms, import 12.66s, tests 23.56s, environment 38ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:2010:              Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:49:      "Shelter map evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:52:      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
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

1. The first-viewport data-age line still said `Route evidence as of`, which lagged the current shelter-map product frame.
2. It now says `Shelter map evidence as of` while preserving the separate bundle generation date.
3. The remaining `Route evidence as of` phrase is only the negative test assertion.
4. This is browser copy and test coverage only. It does not alter manifest parsing, source freshness, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
