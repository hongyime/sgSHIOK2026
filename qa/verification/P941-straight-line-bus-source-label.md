# P941 straight-line bus source label

## Working root

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
head=c37200d
c37200d03690c8a85d8e399670c951495706a6fb	refs/heads/main
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence path ignore check

```text
exit_code=1
```

## Diff stat before commit

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 1 +
 web/lib/__tests__/score-card-copy.test.ts       | 2 ++
 3 files changed, 4 insertions(+), 1 deletion(-)
```

## Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  18:00:06
   Duration  5.89s (transform 1.65s, setup 0ms, import 2.16s, tests 1.58s, environment 1ms)
```

## Label search

```text
C:\sgSHIOK2026\web\app\page.tsx:85:  direct_unrouted_bus: "Straight-line bus estimate",
C:\sgSHIOK2026\web\app\page.tsx:883:    return ["Nearby direct bus service found", "Straight-line bus estimate; no published shelter-map walk.", "No verified shelter-map walk"];
C:\sgSHIOK2026\web\app\page.tsx:1024:    return <div className={styles.sameRouteNote}>Straight-line bus estimate; no published shelter-map walk.</div>;
C:\sgSHIOK2026\web\app\page.tsx:1121:        {directBusFallback ? "Straight-line bus estimate" : previewRoute ? "Shelter-map preview" : "Sheltered walk"}
C:\sgSHIOK2026\web\app\page.tsx:1270:    ? "Straight-line bus estimate"
C:\sgSHIOK2026\web\app\page.tsx:1310:  const sourceEvidenceLabel = directBusFallback ? "Straight-line bus estimate source evidence" : "Shelter source evidence";
C:\sgSHIOK2026\web\app\page.tsx:1311:  const reasonListLabel = directBusFallback ? "Straight-line bus estimate evidence reasons" : "Shelter-map evidence reasons";
C:\sgSHIOK2026\web\app\page.tsx:1384:      ? "Straight-line bus estimate"
C:\sgSHIOK2026\web\app\page.tsx:1422:      directBusFallback ? "Straight-line bus estimate evidence" : undefined
C:\sgSHIOK2026\web\app\page.tsx:1424:    selectedStateText: directBusFallback ? "Straight-line bus estimate selected." : undefined,
C:\sgSHIOK2026\web\app\page.tsx:1794:          aria-label={directBusFallback ? "Straight-line bus estimate details" : "Walk details"}
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1411:    expect(html).toContain("Straight-line bus estimate; no published shelter-map walk.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1412:    expect(html).not.toContain("Straight-line bus estimate; shelter-map walk pending.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1414:    expect(html).toContain("Straight-line bus estimate");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1415:    expect(html).toContain("Straight-line bus estimate selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1418:    expect(html).toContain('aria-label="Straight-line bus estimate source evidence"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1419:    expect(html).toContain('aria-label="Straight-line bus estimate evidence reasons"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1422:    expect(html).not.toContain("Direct bus service estimate");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1425:    expect(html).toContain("Evidence display straight-line bus estimate; Straight-line bus estimate active.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1426:    expect(html).toContain("Straight-line bus estimate evidence 62% covered-walkway ratio; 181 m exposed across 2 gaps; longest gap 142 m.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1430:    expect(html).toContain('aria-label="Straight-line bus estimate details"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1435:    expect(html).not.toContain("Walk display sheltered walk; Direct bus service estimate active.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:85:    expect(source).toContain("Straight-line bus estimate");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:103:    expect(source).toContain("Straight-line bus estimate; no published shelter-map walk.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:104:    expect(source).not.toContain("Straight-line bus estimate; shelter-map walk pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:672:    expect(tsxSource).toContain('aria-label={directBusFallback ? "Straight-line bus estimate details" : "Walk details"}');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1055:    expect(source).toContain('directBusFallback ? "Straight-line bus estimate evidence" : undefined');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1056:    expect(source).not.toContain("Direct bus service estimate evidence");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1057:    expect(source).toContain('direct_unrouted_bus: "Straight-line bus estimate"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1058:    expect(source).not.toContain('direct_unrouted_bus: "Direct bus service estimate"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1066:    expect(source).toContain('directBusFallback ? "Straight-line bus estimate selected." : undefined');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1073:    expect(source).toContain('directBusFallback ? "Straight-line bus estimate source evidence" : "Shelter source evidence"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:1074:    expect(source).toContain('directBusFallback ? "Straight-line bus estimate evidence reasons" : "Shelter-map evidence reasons"');
```

## Diff check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## weights.yaml diff

```text
```

## FINDINGS

1. The route source label table still exposed direct_unrouted_bus as "Direct bus service estimate" after the surrounding UI had moved to "Straight-line bus estimate".
2. The rendered fallback fixture does not currently include a direct_unrouted_bus source segment, so the reliable guard for this label is the source-copy test plus a rendered negative assertion.

## DISAGREEMENTS

1. None.
