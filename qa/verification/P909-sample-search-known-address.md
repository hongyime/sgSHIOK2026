# P909 Sample Search Known Address

## Scope

Change the sample-search prompt from `Need a quick look?` to `Try a known address?`.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=445e8cd6bce5dfb2a6facd3a95b5525b900a31e8
REMOTE=445e8cd6bce5dfb2a6facd3a95b5525b900a31e8	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:2457:        <div className={styles.sampleSearches} aria-label="Sample search">
C:\sgSHIOK2026\web\app\page.tsx:2458:          <span>Need a quick look?</span>
C:\sgSHIOK2026\web\app\page.tsx:2460:            Try Mayflower S560234
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:256:    expect(source).toContain('SEARCHVAL: "Try Mayflower S560234"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:258:    expect(source).toContain('aria-label="Sample search"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:259:    expect(source).toContain("Need a quick look?");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:260:    expect(source).toContain("Try Mayflower S560234");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:38:33
   Duration  14.24s (transform 3.99s, setup 0ms, import 5.13s, tests 3.79s, environment 2ms)
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

1. The sample-search prompt was generic; it did not explain that the Mayflower shortcut is a known address/postal example.

## DISAGREEMENTS

1. None.
