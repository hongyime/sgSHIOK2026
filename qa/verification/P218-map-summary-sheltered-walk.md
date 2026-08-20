# P218 Map Summary Sheltered Walk

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
7f79dc33cb1e3511ea042f2a3dbc3cbf0ba82ee5
7f79dc33cb1e3511ea042f2a3dbc3cbf0ba82ee5	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                             |  3 +++
 web/components/route-evidence-map.tsx                    | 12 ++++++------
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 12 ++++++++----
 3 files changed, 17 insertions(+), 10 deletions(-)
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  04:54:21
   Duration  3.35s (transform 1.20s, setup 0ms, import 372ms, tests 1.14s, environment 1ms)
```

## Old Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:48:    expect(source).not.toContain('return "sheltered route";');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:49:    expect(source).not.toContain('return "shortest and sheltered routes";');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:50:    expect(source).not.toContain("sheltered-route segments");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:54:    expect(source).not.toContain("covered-route segments");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:55:    expect(source).not.toContain('return "covered route";');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:56:    expect(source).not.toContain('return "shortest and covered routes";');
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

1. The map component's non-visual summaries still announced `sheltered route`, `shortest route`, and `sheltered-route segments` after visible map and panel copy had moved to walk language.
2. The non-visual map aria and text summaries now announce sheltered/shortest walks and walk segments; old route phrases remain only as negative regression guards.
3. The change is browser accessibility copy and test coverage only; it does not alter map geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
