# P911 Disconnected Walk Copy

## Scope

Change graph-disconnected transit copy from `not connected yet` wording to current published-data limitation wording.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=8fbdd5c66e1fff3a9c476b5f35b25690bfff6224
REMOTE=8fbdd5c66e1fff3a9c476b5f35b25690bfff6224	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:598:  if (reason === "transit_candidates_graph_disconnected") return "Shelter-map walk not connected yet";
C:\sgSHIOK2026\web\app\page.tsx:615:      return "Transit stops or exits exist, but the published shelter-map data has no connected shelter-map walk yet.";
C:\sgSHIOK2026\web\app\page.tsx:867:      return ["Transit stop or exit found", "Shelter-map walk not connected yet"];
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:32:    expect(source).toContain("Shelter-map walk not connected yet");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:44:    expect(source).toContain("Transit stops or exits exist, but the published shelter-map data has no connected shelter-map walk yet.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1140:    expect(html).toContain("Shelter-map walk not connected yet");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1142:    expect(html).toContain("Transit stops or exits exist, but the published shelter-map data has no connected shelter-map walk yet.");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:48:11
   Duration  8.20s (transform 2.34s, setup 0ms, import 2.92s, tests 2.51s, environment 1ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

Exit code: 0.

### Locked weights diff

```text
```

Exit code: 0.

### Repository integrity

```text
repo_integrity=ok
```

Exit code: 0.

## FINDINGS

1. The graph-disconnected copy used `yet`, which implied a pending repair rather than stating the current published-data limitation.

## DISAGREEMENTS

1. None.
