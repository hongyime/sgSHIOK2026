# P217 Map Legend Sheltered Walk

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
66f9c926e7ac09e1c70740b095ab08541cea89dd
66f9c926e7ac09e1c70740b095ab08541cea89dd	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                             | 3 +++
 web/app/page.tsx                                         | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx          | 3 +++
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
 web/lib/__tests__/score-card-copy.test.ts                | 2 +-
 5 files changed, 10 insertions(+), 3 deletions(-)
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  44 passed (44)
   Start at  04:51:12
   Duration  2.20s (transform 1.54s, setup 0ms, import 1.67s, tests 1.07s, environment 1ms)
```

## Old Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:47:    expect(source).not.toContain("Route evidence for ${routeLabels}.");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:48:    expect(source).not.toContain("Route evidence map for ${labels}, showing ${routeModeLabel(mode)}");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:178:    expect(pageSource).not.toContain("Preview route evidence only");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:193:    expect(pageSource).not.toContain('previewRoute ? "Shelter map preview" : "Sheltered route"');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:194:    expect(pageSource).not.toContain('previewRoute ? "Preview route" : "Sheltered route"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:102:      "Route evidence as of {formatDataDate(manifest)}; bundle generated {formatGeneratedDate(manifest)}"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:173:    expect(source).not.toContain('"Sheltered route"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:198:    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:261:    expect(source).not.toContain("Route evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:262:    expect(source).not.toContain('aria-label="Route evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:263:    expect(source).not.toContain('aria-label="Route evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:264:    expect(source).not.toContain("Route evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:265:    expect(source).not.toContain("Route evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:266:    expect(source).not.toContain("Route evidence available");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:177:    expect(html).not.toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:207:    expect(html).not.toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:266:    expect(html).not.toContain("Preview route");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:268:    expect(html).not.toContain("Preview route evidence only");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:269:    expect(html).not.toContain("Preview route evidence selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:271:    expect(html).not.toContain("Route evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:327:    expect(html).not.toContain("Sheltered route");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:332:    expect(html).not.toContain("Route evidence and locked score");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:334:    expect(html).not.toContain('aria-label="Route evidence and locked score breakdown"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:335:    expect(html).not.toContain('aria-label="Route evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:493:    expect(html).not.toContain("Route evidence unavailable");
```

## Evidence Ignore Check

```text
exit=1
```

## Locked Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. The inline map legend still labeled the primary displayed line as `Sheltered route` while the surrounding control, panel, and status copy had moved to walk language.
2. The legend now says `Sheltered walk`; the old phrase remains only as negative regression guards in tests.
3. The change is browser copy and test coverage only; it does not alter map geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
