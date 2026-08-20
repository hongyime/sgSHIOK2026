# P191 Shelter Map Test Framing

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. Current rendered copy is already shelter-map framed, but some web test descriptions and one page fallback comment still described the same surface as generic route evidence.
2. The change updates maintainers' test/comment language without changing component names, public data, scoring, exports, or runtime behavior.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  29 passed (29)
   Start at  02:09:55
   Duration  9.05s (transform 6.76s, setup 0ms, import 7.51s, tests 4.96s, environment 1ms)
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\web\app\page.tsx:592:  // 3. Fallback: show shelter map evidence only while OneMap loads in background.
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:4:describe("shelter map interactions", () => {
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:15:  it("keeps shelter-map evidence and transit POIs visible on the subdued basemap", () => {
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:207:      pageSource.indexOf("Fallback: show shelter map evidence only while OneMap loads in background")
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:166:  it("introduces the shelter map panel before search", () => {
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:276:  it("explains when a searched postal has no published shelter map route", () => {
```

## FINDINGS

1. Test and code-comment framing lagged behind the rendered product copy: maintainers still saw "route evidence" labels around the shelter map panel and fallback path.

## DISAGREEMENTS

1. None.
