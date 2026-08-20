# P144 Shelter Map Breakdown Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The score-card breakdown and reason group now use shelter-map evidence labels:

```text
aria-label="Shelter map evidence reasons"
aria-label="Shelter map evidence and locked score breakdown"
Shelter map evidence and locked score
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:56:03
   Duration  5.87s (transform 3.86s, setup 0ms, import 7.60s, tests 7.90s, environment 9ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1334:      <div className={styles.reasonList} aria-label="Shelter map evidence reasons">
C:\sgSHIOK2026\web\app\page.tsx:1343:        <div className={styles.scoreBreakdown} aria-label="Shelter map evidence and locked score breakdown">
C:\sgSHIOK2026\web\app\page.tsx:1345:            <strong>Shelter map evidence and locked score</strong>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:274:      html.indexOf('aria-label="Shelter map evidence and locked score breakdown"'),
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:286:    expect(html).toContain("Shelter map evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:287:    expect(html).toContain('aria-label="Shelter map evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:289:    expect(html).toContain('aria-label="Shelter map evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:290:    expect(html).not.toContain("Route evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:291:    expect(html).not.toContain('aria-label="Route evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:292:    expect(html).not.toContain('aria-label="Route evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:175:    expect(source).toContain("Shelter map evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:176:    expect(source).toContain('aria-label="Shelter map evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:177:    expect(source).toContain('aria-label="Shelter map evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:178:    expect(source).not.toContain("Route evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:179:    expect(source).not.toContain('aria-label="Route evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:180:    expect(source).not.toContain('aria-label="Route evidence reasons"');
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

1. The secondary breakdown still exposed `Route evidence and locked score` and `Route evidence reasons`, lagging the shelter-map product frame now used by the title, map, panel, and data-age line.
2. The breakdown and reason group now use shelter-map evidence labels while preserving the locked score as a secondary row.
3. This is browser copy/accessibility naming and test coverage only. It does not alter score rows, ranking, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
