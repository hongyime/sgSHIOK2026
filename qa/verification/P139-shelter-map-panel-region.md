# P139 Shelter Map Panel Region

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The score-card region now uses the shelter-map panel accessible name in all three render states:

```text
aria-label="Shelter map panel"
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:38:55
   Duration  6.24s (transform 4.22s, setup 0ms, import 5.70s, tests 8.73s, environment 12ms)
```

## Label Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1025:      <section className={styles.scoreCard} aria-label="Shelter map panel">
C:\sgSHIOK2026\web\app\page.tsx:1040:      <section className={styles.scoreCard} aria-label="Shelter map panel">
C:\sgSHIOK2026\web\app\page.tsx:1222:    <section className={styles.scoreCard} aria-label="Shelter map panel">
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:525:      const card = document.querySelector('section[aria-label="Shelter map panel"]');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:67:    expect(script).toContain('section[aria-label="Shelter map panel"]');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:68:    expect(script).not.toContain('section[aria-label="Route evidence panel"]');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:69:    expect(script).not.toContain('section[aria-label="Score panel"]');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:163:    expect(html).toContain('aria-label="Shelter map panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:166:    expect(html).not.toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:167:    expect(html).not.toContain('aria-label="Score panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:189:    expect(html).toContain('aria-label="Shelter map panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:193:    expect(html).not.toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:194:    expect(html).not.toContain('aria-label="Score panel"');
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

1. The detail card region still exposed `Route evidence panel` as its accessible name in all render states, even after the visible app title, map label, empty copy, and live region had moved to shelter-map framing.
2. The region is now named `Shelter map panel`, and browser-smoke selectors were updated to keep automated checks targeting the same surface.
3. This is browser accessibility naming and test-selector maintenance only. It does not alter score-card state, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
