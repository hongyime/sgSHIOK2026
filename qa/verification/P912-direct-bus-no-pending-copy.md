# P912 Direct Bus No Pending Copy

## Scope

Change direct-bus fallback copy from `shelter-map walk pending` / `No verified shelter-map walk yet` to current published-evidence boundary wording.

## Commands

### Root and remote

```text
PWD=C:\sgSHIOK2026
HOST=Prawn-E14
HEAD=1f1f9e76b34f80e9cdd320df593cd667012e34ce
REMOTE=1f1f9e76b34f80e9cdd320df593cd667012e34ce	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:75:    expect(source).toContain("No verified shelter-map walk yet");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:100:    expect(source).not.toContain("Direct line to bus stop; walking route pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:101:    expect(source).toContain("Straight-line bus estimate; shelter-map walk pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:102:    expect(source).not.toContain("Direct line to bus stop; shelter-map walk pending.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:869:    expect(source).toContain("No verified shelter-map walk yet");
C:\sgSHIOK2026\web\app\page.tsx:881:    return ["Nearby direct bus service found", "Straight-line bus estimate; shelter-map walk pending.", "No verified shelter-map walk yet"];
C:\sgSHIOK2026\web\app\page.tsx:1022:    return <div className={styles.sameRouteNote}>Straight-line bus estimate; shelter-map walk pending.</div>;
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1388:    expect(html).toContain("No verified shelter-map walk yet");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1390:    expect(html).toContain("Straight-line bus estimate; shelter-map walk pending.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1391:    expect(html).not.toContain("Direct line to bus stop; shelter-map walk pending.");
```

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  15:52:01
   Duration  8.27s (transform 2.52s, setup 0ms, import 3.25s, tests 2.24s, environment 2ms)
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

1. Direct-bus fallback copy used pending/yet language even though the current user-facing state is a straight-line estimate with no published shelter-map walk.

## DISAGREEMENTS

1. None.
