# P216 Shelter-Map Walk Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
bb9eae6cb9394ff76b8428c87c5928cac4ad0bf2
bb9eae6cb9394ff76b8428c87c5928cac4ad0bf2	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                    |  3 +++
 web/app/page.tsx                                |  8 ++++----
 web/lib/__tests__/accessibility-render.test.tsx | 14 +++++++++-----
 web/lib/__tests__/score-card-copy.test.ts       |  3 ++-
 4 files changed, 18 insertions(+), 10 deletions(-)
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  04:47:18
   Duration  4.29s (transform 1.91s, setup 0ms, import 2.47s, tests 1.10s, environment 1ms)
```

## Old Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:229:    expect(tsxSource).not.toContain("onto the shelter-map route");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:176:    expect(html).not.toContain("No shelter map route selected.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:293:    expect(html).not.toContain("No shelter map route is published for this postal");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:294:    expect(html).not.toContain("No shelter map route is published for this postal in the frozen June 2020 address universe.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:370:    expect(html).not.toContain("onto the shelter-map route");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:450:    expect(html).not.toContain("<span>MRT/LRT</span><small>no shelter map route</small>");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:451:    expect(html).not.toContain("<span>Bus</span><small>shelter map route</small>");
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

1. Three rendered UI surfaces still used `shelter map route` / `shelter-map route` wording after the product framing had moved to walks: transit-target availability labels, the outside-bundle message, and the snap-connector helper.
2. The old route wording now remains only as negative regression guards in tests across the touched surfaces.
3. The change is browser copy and test coverage only; it does not alter geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
