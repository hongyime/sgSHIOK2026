# P141 Outside Shelter Map Bundle

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The outside-bundle detail panel now says:

```text
Outside shelter-map bundle
No shelter map route is published for this postal in the frozen June 2020 address universe.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:45:31
   Duration  5.87s (transform 3.26s, setup 0ms, import 4.96s, tests 8.54s, environment 12ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:1046:          <strong>Outside shelter-map bundle</strong>
C:\sgSHIOK2026\web\app\page.tsx:1047:          <span>No shelter map route is published for this postal in the frozen June 2020 address universe.</span>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:251:    expect(html).toContain("Outside shelter-map bundle");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:253:    expect(html).not.toContain("Outside current bundle");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:255:      "No shelter map route is published for this postal in the frozen June 2020 address universe."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:257:    expect(html).not.toContain("No route evidence is published for this postal");
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

1. The outside-bundle detail panel still used `Outside current bundle` and `No route evidence is published`, mixing older route-evidence framing with the newer shelter-map bundle copy.
2. The panel now says `Outside shelter-map bundle` and explains that no shelter map route is published for the postal in the frozen June 2020 address universe.
3. This is browser copy and test coverage only. It does not alter search behavior, score lookup, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
