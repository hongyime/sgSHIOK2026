# P914 Far Walk Published Copy

## Scope

Change the far connected-walk note from passive `found is about` wording to published connected-walk wording.

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
61575e36af6dd572cd87175377f7a4b4bdd78e24
61575e36af6dd572cd87175377f7a4b4bdd78e24	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:622:      return `Closest connected shelter-map walk found is about ${formatDistance(nearestM)} away; locked transit range is 1.2 km.`;
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1096:      "Closest connected shelter-map walk found is about 1.5 km away; locked transit range is 1.2 km."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:53:    expect(source).toContain("Closest connected shelter-map walk found is about ${formatDistance(nearestM)}");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:01:24
   Duration  18.90s (transform 6.46s, setup 0ms, import 7.89s, tests 5.41s, environment 3ms)
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

1. The far connected-walk note still used passive `found is about` wording even though the UI can name the actual user-facing fact: the nearest published connected shelter-map walk is beyond the locked scoring range.

## DISAGREEMENTS

1. None.
