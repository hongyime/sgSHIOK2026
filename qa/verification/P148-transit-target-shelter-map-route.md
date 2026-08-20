# P148 Transit Target Shelter Map Route

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

Transit-target tab availability labels now say:

```text
shelter map route
no shelter map route
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:10:22
   Duration  10.25s (transform 7.22s, setup 0ms, import 9.33s, tests 15.09s, environment 29ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:157:  it("introduces the score panel as sheltered route evidence before search", () => {
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:165:    expect(html).toContain("No shelter map route selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:170:    expect(html).not.toContain("No route evidence selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:191:    expect(html).not.toContain("Postal 560231 route evidence panel loaded.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).not.toContain("Preview route evidence only");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:238:    expect(html).not.toContain("this clicked stop has route evidence");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:244:  it("explains when a searched postal has no published route evidence", () => {
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:259:      "No shelter map route is published for this postal in the frozen June 2020 address universe."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:261:    expect(html).not.toContain("No route evidence is published for this postal");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:321:      "Snap connector is the short link from the postal or transit point onto mapped walking-route evidence."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:371:    expect(html).toContain("<span>MRT/LRT</span><small>no shelter map route</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:372:    expect(html).toContain("<span>Bus</span><small>shelter map route</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:373:    expect(html).not.toContain("<span>MRT/LRT</span><small>no route evidence</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:374:    expect(html).not.toContain("<span>Bus</span><small>route evidence</small>");
C:\sgSHIOK2026\web\app\page.tsx:156:  if (!selection) return "No shelter map route selected.";
C:\sgSHIOK2026\web\app\page.tsx:164:      ? "Preview route evidence selected."
C:\sgSHIOK2026\web\app\page.tsx:434:      return "Transit stops or exits exist, but this bundle has no connected walking route evidence yet.";
C:\sgSHIOK2026\web\app\page.tsx:583:  // 3. Fallback: show route evidence only while OneMap loads in background.
C:\sgSHIOK2026\web\app\page.tsx:893:    if (available) return "shelter map route";
C:\sgSHIOK2026\web\app\page.tsx:894:    return "no shelter map route";
C:\sgSHIOK2026\web\app\page.tsx:1047:          <span>No shelter map route is published for this postal in the frozen June 2020 address universe.</span>
C:\sgSHIOK2026\web\app\page.tsx:1145:      ? "Snap connector is the short link from the postal or transit point onto mapped walking-route evidence."
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

1. Transit-target tab availability labels still said `route evidence` and `no route evidence`, even though those tabs indicate whether a shelter-map route exists for MRT/LRT or bus.
2. The labels now say `shelter map route` and `no shelter map route` while preserving the selected-route label for the best transit tab.
3. This is browser copy and test coverage only. It does not alter transit-mode selection, route options, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
