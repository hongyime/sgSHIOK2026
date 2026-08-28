# P643 Exposed Gap Missing Coordinate Grammar

Working root: C:\sgSHIOK2026
Host: PRAWN-E14

## Scope

- Free-tier web copy polish only.
- No scoring, export, rescore, subset run, ingest, or network build.
- No writes to protected data, QA evidence payloads, release bundles, `web/public/data/`, `checksums.json`, or `pipeline/config/weights.yaml`.

## Evidence

Commands and results are recorded after implementation.

### Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

### Focused Render And Source Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  54 passed (54)
   Start at  11:02:45
   Duration  8.69s (transform 4.41s, setup 0ms, import 5.03s, tests 1.37s, environment 1ms)
```

### First Full Web Run

```text
 FAIL  lib/__tests__/data.test.ts > generated data bundle > geometry postal prefix shards match the full postal index
Error: Test timed out in 15000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/data.test.ts:95:3
     93|   });
     94|
     95|   it("geometry postal prefix shards match the full postal index", () =…
       |   ^
     96|     const geomPostalIndex = readJson<Record<string, string>>("geom/pos…
     97|     const expectedPrefixIndex: Record<string, Record<string, string>> …


 Test Files  1 failed | 23 passed (24)
      Tests  1 failed | 164 passed (165)
   Start at  11:03:28
   Duration  104.73s (transform 3.53s, setup 0ms, import 6.08s, tests 68.78s, environment 41ms)
```

### Full Web Rerun

```text
 Test Files  24 passed (24)
      Tests  165 passed (165)
   Start at  11:05:25
   Duration  43.07s (transform 2.56s, setup 0ms, import 4.97s, tests 11.56s, environment 12ms)
```

### Python Collection

```text
457 tests collected in 59.83s
```

### Repository Integrity

```text
repo_integrity=ok
exit=0
```

### Evidence Tracking Check

```text
exit=1
```

### Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

### Protected Files Check

```text
exit=0
```

## FINDINGS

1. A single exposed gap without map coordinates still used plural fallback copy: `No map coordinates are recorded for these exposed gaps.`
2. The fallback now says `this exposed gap` for one gap and preserves `these exposed gaps` for plural gap lists.
3. The first full web run hit the known heavy generated-bundle prefix-index timeout in `lib/__tests__/data.test.ts`; the immediate full-suite rerun passed without code changes.

## DISAGREEMENTS

1. None.
