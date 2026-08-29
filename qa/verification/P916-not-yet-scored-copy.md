# P916 Not Yet Scored Copy

## Scope

Change the `NOT_YET_SCORED` explanatory sentence from pending-style `yet` wording to a static published-data boundary.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
24a8a2a4ab8b4bc8a54d8fad8b4934adcaf168dd
24a8a2a4ab8b4bc8a54d8fad8b4934adcaf168dd	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:626:  if (score.state === "NOT_YET_SCORED") {
C:\sgSHIOK2026\web\app\page.tsx:627:    return "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet.";
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1301:      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:148:      "This postal is in the June 2020 address list, but the published shelter-map data has no full locked score for it yet."
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:10:17
   Duration  4.18s (transform 1.27s, setup 0ms, import 1.64s, tests 1.10s, environment 1ms)
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

1. The `NOT_YET_SCORED` note still used `yet`, implying pending scoring rather than the current published-data boundary.

## DISAGREEMENTS

1. None.
