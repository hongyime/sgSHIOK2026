# P919 Access Unavailable Copy

## Scope

Change the unavailable access-row meta from `Walk-to-transit score unavailable` to `Stop/exit walk score unavailable`, matching the displayed row label while preserving the scored locked-term meta.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
39a9a3397dcd4516800f999a9d8cbc144fce9935
39a9a3397dcd4516800f999a9d8cbc144fce9935	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:1464:          label: "Walk to stop or exit",
C:\sgSHIOK2026\web\app\page.tsx:1466:          meta: scoredMeta(score.subscores.access, "35% locked walk-to-transit", "Walk-to-transit score unavailable"),
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1252:    expect(html).toContain("<strong>Unavailable</strong><small>Walk-to-transit score unavailable</small>");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:22:18
   Duration  15.76s (transform 5.55s, setup 0ms, import 6.61s, tests 3.06s, environment 2ms)
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

1. The unavailable access row still used the old abstract `Walk-to-transit score unavailable` wording after the visible row label had moved to `Walk to stop or exit`.

## DISAGREEMENTS

1. None.
