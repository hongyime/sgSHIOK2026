# P145 Planning Area Comparison Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The planning-area rank panel now presents as a comparison panel:

```text
aria-label="Planning-area comparison"
Compare nearby records
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:59:26
   Duration  9.59s (transform 6.26s, setup 0ms, import 8.42s, tests 14.23s, environment 17ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:275:      html.indexOf('aria-label="Planning-area comparison"')
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:299:    expect(html).toContain('aria-label="Planning-area comparison"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:300:    expect(html).toContain("Compare nearby records");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:302:    expect(html).not.toContain('aria-label="Rank by view"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:303:    expect(html).not.toContain("<strong>Rank by</strong>");
C:\sgSHIOK2026\web\app\page.tsx:1368:        <div className={styles.rankPanel} aria-label="Planning-area comparison" aria-busy={rankingLoading}>
C:\sgSHIOK2026\web\app\page.tsx:1371:              <strong>Compare nearby records</strong>
C:\sgSHIOK2026\web\app\page.tsx:1382:                <span className={styles.srOnly}>Rank records by</span>
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:185:    expect(source).toContain('aria-label="Planning-area comparison"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:186:    expect(source).toContain("Compare nearby records");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:187:    expect(source).not.toContain('aria-label="Rank by view"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:188:    expect(source).not.toContain("<strong>Rank by</strong>");
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

1. The planning-area panel still presented itself as `Rank by`, which made the secondary ranking affordance feel more primary than the shelter-map comparison use case.
2. The panel now presents as `Compare nearby records` with `Planning-area comparison` as its accessible name, while preserving the locked-score and component-score ranking controls.
3. The remaining `Rank records by` phrase is the hidden label for the select control, where ranking is the control's exact function.
4. This is browser copy/accessibility naming and test coverage only. It does not alter ranking data fetches, rank metrics, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
