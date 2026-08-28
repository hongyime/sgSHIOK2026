# P646 Direct Bus Service Label

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

### Source Search

```text
C:\sgSHIOK2026\web\app\page.tsx:85:  direct_unrouted_bus: "Direct bus service estimate",
C:\sgSHIOK2026\web\app\page.tsx:1075:        {directBusFallback ? "Direct bus service estimate" : previewRoute ? "Shelter-map preview" : "Sheltered walk"}
C:\sgSHIOK2026\web\app\page.tsx:1222:    ? "Direct bus service estimate"
C:\sgSHIOK2026\web\app\page.tsx:1314:      ? "direct bus service estimate"
C:\sgSHIOK2026\web\app\page.tsx:1321:      ? "Direct bus service estimate"
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:70:    expect(source).toContain("Direct bus service estimate");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:71:    expect(source).not.toContain("Direct bus line estimate");
```

### Focused Render And Source Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  11:24:14
   Duration  5.48s (transform 1.75s, setup 0ms, import 2.19s, tests 1.31s, environment 1ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  11:24:40
   Duration  45.37s (transform 2.83s, setup 0ms, import 5.14s, tests 18.11s, environment 23ms)
```

### Python Collection

```text
457 tests collected in 15.61s
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

1. Direct-bus fallback labels still used `Direct bus line estimate`, which could read as line geometry even though the path is service evidence without a verified shelter-map walk.
2. Direct-bus fallback labels now use `Direct bus service estimate`, aligning the visible label with the direct-bus evidence caveat.

## DISAGREEMENTS

1. None.
