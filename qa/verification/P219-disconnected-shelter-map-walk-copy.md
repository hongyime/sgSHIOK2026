# P219 Disconnected Shelter-Map Walk Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Head And Remote

```text
3d2e8d55a77fc42700fd380475aaa5920d478a41
3d2e8d55a77fc42700fd380475aaa5920d478a41	refs/heads/main
```

## Scope

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              | 3 +++
 web/app/page.tsx                          | 4 ++--
 web/lib/__tests__/score-card-copy.test.ts | 5 +++--
 3 files changed, 8 insertions(+), 4 deletions(-)
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  04:57:49
   Duration  2.08s (transform 1.08s, setup 0ms, import 1.39s, tests 374ms, environment 1ms)
```

## Old Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:558:    expect(html).not.toContain("Direct line to bus stop; walking route pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:22:    expect(source).not.toContain("Transit route not connected yet");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:23:    expect(source).not.toContain("Transit stops or exits exist, but this shelter-map bundle has no connected walking route yet.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:24:    expect(source).not.toContain("Walking route not connected yet");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:27:    expect(source).not.toContain("Direct line to bus stop; walking route pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:28:    expect(source).not.toContain("Shelter-map route not verified yet");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:31:    expect(source).not.toContain("Transit candidates exist, but this bundle has no connected walking route evidence yet.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:32:    expect(source).not.toContain("Transit stops or exits exist, but this bundle has no connected walking route evidence yet.");
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

1. The disconnected no-transit state already explained the missing artifact as a shelter-map walk, but its title and reason chip still said `Transit route not connected yet` and `Walking route not connected yet`.
2. The disconnected state now consistently names the missing artifact as `Shelter-map walk not connected yet`; old route phrases remain only as negative regression guards.
3. The change is browser copy and test coverage only; it does not alter candidate selection, routing, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
