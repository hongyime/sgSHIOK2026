# P908 OneMap Failed Search Recovery

## Scope

Change the generic OneMap address-search failure fallback from `Failed to search OneMap address.` to a recovery instruction.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=f3ecb78711780378231631f259ee4bb09cc2ad18
REMOTE=f3ecb78711780378231631f259ee4bb09cc2ad18	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:2323:        setError("OneMap search is busy. Try again in a moment, or enter a 6-digit postal code.");
C:\sgSHIOK2026\web\app\page.tsx:2326:      setError(err instanceof Error ? err.message : "Failed to search OneMap address.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:271:    expect(source).toContain("OneMap search is busy. Try again in a moment, or enter a 6-digit postal code.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:272:    expect(source).not.toContain("OneMap search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:273:    expect(source).not.toContain("Search is busy. Please try again in a moment.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:274:    expect(source).toContain("Failed to search OneMap address.");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:35:07
   Duration  4.93s (transform 1.48s, setup 0ms, import 1.91s, tests 1.37s, environment 1ms)
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

1. The generic OneMap search failure fallback named the failure but did not tell users that postal-code entry or another search could recover.

## DISAGREEMENTS

1. None.
