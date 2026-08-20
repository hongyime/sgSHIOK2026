# P185 Browser Smoke Walk-Display Selector

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Ignore Check

```text
check_ignore_exit=1
```

## Finding

The browser smoke harness still queried `[aria-label="Route display"] button` after the app renamed the route-mode control to `Walk display`. That could make smoke runs fail to select shortest/both walk modes even though the product UI and accessibility tests were correct.

## Evidence

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:58:    expect(smokeSource).toContain('[aria-label="Walk display"] button');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:59:    expect(smokeSource).not.toContain('[aria-label="Route display"] button');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:148:    expect(source).toContain('aria-label="Walk display"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:157:    expect(source).not.toContain('aria-label="Route display"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:    expect(html).toContain("Walk display shortest");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:206:    expect(html).not.toContain("Route display shortest");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:214:    expect(html).toContain("Walk display sheltered");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:216:    expect(html).not.toContain("Walk display shiokest");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:218:    expect(html).not.toContain("Route display sheltered");
C:\sgSHIOK2026\web\app\page.tsx:176:  return `${postal} shelter map panel loaded. ${stationName ?? "Transit target loaded"}. Locked score ${scoreText}. ${stopText} Walk display ${routeDisplayLabel ?? routeMode}; ${selectedRouteLabel ?? "walk"} active.`;
C:\sgSHIOK2026\web\app\page.tsx:858:    <div className={`${styles.segmented} ${styles.routeSegmented}`} aria-label="Walk display">
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:433:    `Array.from(document.querySelectorAll('[aria-label="Walk display"] button')).some((button) => button.textContent?.trim() === '${label}')`,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:439:      const button = Array.from(document.querySelectorAll('[aria-label="Walk display"] button'))
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:446:    `Array.from(document.querySelectorAll('[aria-label="Walk display"] button')).some((button) => button.textContent?.trim() === '${label}' && button.getAttribute('aria-pressed') === 'true')`,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:532:      const activeRouteButton = Array.from(document.querySelectorAll('[aria-label="Walk display"] button'))
```

## Scope

This is browser-smoke selector alignment only. It does not change app rendering, scoring, export, input artifacts, public data, deployment, or `pipeline/config/weights.yaml`.

## FINDINGS

1. Browser smoke still queried the old `Route display` accessible name after the app exposed `Walk display`.
2. The smoke harness now uses the same walk-control accessible name the app renders and the accessibility tests expect.

## DISAGREEMENTS

1. None.
