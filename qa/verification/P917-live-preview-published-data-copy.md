# P917 Live Preview Published Data Copy

## Scope

Change live OneMap preview copy from `not part of the published shelter-map data yet` to `outside the published shelter-map data`.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
2ee9a82fe566b73f52714ffae038119ae63f2470
2ee9a82fe566b73f52714ffae038119ae63f2470	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:607:    return "Preview only: this clicked MRT/LRT exit or bus stop has shelter-map evidence, but it is not part of the published shelter-map data yet.";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:436:      "Preview only: this clicked MRT/LRT exit or bus stop has shelter-map evidence, but it is not part of the published shelter-map data yet."
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:255:    expect(pageSource).toContain("not part of the published shelter-map data yet");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  16:12:36
   Duration  7.63s (transform 2.34s, setup 0ms, import 2.94s, tests 1.86s, environment 1ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
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

1. Live OneMap preview copy still used `yet`, implying future inclusion rather than the current boundary: the clicked stop or exit is outside the frozen published shelter-map data.

## DISAGREEMENTS

1. None.
