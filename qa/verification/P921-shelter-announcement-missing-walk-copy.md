# P921 Shelter Announcement Missing Walk Copy

## Scope

Change the default screen-reader shelter evidence fallback from `Shelter-map walk evidence unavailable.` to `No published shelter-map walk evidence.`

## Commands

### Root and remote before edit

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
41a3ce8e14c49eb39f45fabc84a1fd5e2afaeba9
41a3ce8e14c49eb39f45fabc84a1fd5e2afaeba9	refs/heads/main
```

### Copy context before edit

```text
C:\sgSHIOK2026\web\app\page.tsx:245:    : `${evidenceLabel} unavailable.`;
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:1249:    expect(html).toContain("Shelter-map walk evidence unavailable.");
```

### First focused web test run

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (22 tests | 1 failed) 775ms
     × puts data freshness and heat proxy copy in the title card 206ms

AssertionError: expected source not to contain '`${evidenceLabel} unavailable.`;'

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 62 passed (63)
   Start at  16:29:49
   Duration  15.44s (transform 4.67s, setup 0ms, import 5.83s, tests 4.75s, environment 2ms)
```

The failed assertion was too broad: the implementation intentionally preserves the generic fallback for custom evidence labels and only changes the default shelter-map walk evidence fallback.

### Focused web tests after assertion correction

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  16:30:36
   Duration  5.08s (transform 1.61s, setup 0ms, import 2.05s, tests 1.33s, environment 1ms)
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

1. The screen-reader shelter evidence fallback still said `Shelter-map walk evidence unavailable.` even after visible missing-walk chips had moved to `No published shelter-map walk`.
2. The first test assertion was too broad because it rejected the generic fallback that remains correct for custom evidence labels.

## DISAGREEMENTS

1. None.
