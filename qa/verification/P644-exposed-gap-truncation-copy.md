# P644 Exposed Gap Truncation Copy

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
      Tests  55 passed (55)
   Start at  11:10:07
   Duration  6.54s (transform 2.34s, setup 0ms, import 2.82s, tests 1.58s, environment 1ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  11:10:41
   Duration  64.70s (transform 3.02s, setup 0ms, import 5.61s, tests 29.00s, environment 13ms)
```

### Python Collection

```text
457 tests collected in 19.72s
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

1. The truncated exposed-gap list used nounless copy: `Showing the longest 3; 1 shorter gap included in the total.`
2. The visible copy now says `Showing the 3 longest exposed gaps; 1 shorter exposed gap included in the total.`
3. The initial scan hypothesis that `Showing the longest 1` could render was wrong for the current `slice(0, 3)` logic; the real defect was the plural truncated state missing the noun.

## DISAGREEMENTS

1. None.
