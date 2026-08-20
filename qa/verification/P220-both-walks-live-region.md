# P220 Both Walks Live Region

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
5e8b3a996966997d486a2df625f98ee6a60be03d
5e8b3a996966997d486a2df625f98ee6a60be03d	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                    | 3 +++
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 2 ++
 3 files changed, 6 insertions(+), 1 deletion(-)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  05:00:56
   Duration  2.47s (transform 1.08s, setup 0ms, import 1.43s, tests 454ms, environment 0ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:13:  routeDisplayAnnouncement,
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:222:    expect(routeDisplayAnnouncement("shortest", true)).toBe("shortest same as sheltered walk");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:223:    expect(routeDisplayAnnouncement("shortest", true)).not.toBe("shortest same as sheltered route");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:224:    expect(routeDisplayAnnouncement("both", false)).toBe("both walks");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:225:    expect(routeDisplayAnnouncement("both", false)).not.toBe("both routes");
C:\sgSHIOK2026\web\app\page.tsx:140:export function routeDisplayAnnouncement(mode: RouteDisplayMode, sameRoute: boolean): string {
C:\sgSHIOK2026\web\app\page.tsx:141:  if (mode === "both") return "both walks";
C:\sgSHIOK2026\web\app\page.tsx:1114:    routeDisplayLabel: routeDisplayAnnouncement(routeMode, sameRoute),
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

1. The walk-display live-region helper still announced Both mode as `both routes`, even though the control is labeled Walk display and surrounding copy now uses walk language.
2. Both mode now announces `both walks`; the old phrase remains only as a negative regression guard.
3. The change is browser accessibility copy and test coverage only; it does not alter display mode behavior, map geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
