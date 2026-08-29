# P907 OneMap Busy Error Copy

## Scope

Change the OneMap 429 search error to mention direct 6-digit postal-code entry as a fallback.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=01715bf9c05f09f7109df4b84fa47cbfe2a0396b
REMOTE=01715bf9c05f09f7109df4b84fa47cbfe2a0396b	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:2323:        setError("OneMap search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\app\page.tsx:2326:      setError(err instanceof Error ? err.message : "Failed to search OneMap address.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:271:    expect(source).toContain("OneMap search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:272:    expect(source).not.toContain("Search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:273:    expect(source).toContain("Failed to search OneMap address.");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:31:44
   Duration  6.16s (transform 2.12s, setup 0ms, import 2.72s, tests 1.57s, environment 1ms)
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
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

1. The OneMap busy error told users to wait, but did not tell them the direct postal-code path still works.

## DISAGREEMENTS

1. None.
