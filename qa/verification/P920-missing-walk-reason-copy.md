# P920 Missing Walk Reason Copy

## Scope

Change the generic missing-path reason chip from `Shelter-map evidence unavailable` to `No published shelter-map walk`.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
8470ecd828a7e0fb771cdf8bab5198e9c5c54e7b
8470ecd828a7e0fb771cdf8bab5198e9c5c54e7b	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:883:  if (!score.paths || !score.best_node) return ["Shelter-map evidence unavailable", "Locked score unavailable"];
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1247:    expect(html).toContain("Shelter-map evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:720:    expect(source).toContain("Shelter-map evidence unavailable");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:26:16
   Duration  5.67s (transform 1.77s, setup 0ms, import 2.28s, tests 1.65s, environment 2ms)
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
EXIT=0
```

## FINDINGS

1. The generic missing-path reason chip still said `Shelter-map evidence unavailable`, which was broader than the actual user-facing absence: no published shelter-map walk.

## DISAGREEMENTS

1. None.
