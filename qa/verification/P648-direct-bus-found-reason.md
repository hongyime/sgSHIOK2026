# P648 Direct Bus Found Reason

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
   Start at  11:34:43
   Duration  9.46s (transform 3.40s, setup 0ms, import 4.22s, tests 2.12s, environment 1ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  11:35:20
   Duration  43.61s (transform 2.39s, setup 0ms, import 4.43s, tests 19.71s, environment 12ms)
```

### Python Collection

```text
457 tests collected in 19.87s
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

1. The direct-bus fallback score reason still said `Nearby bus service found`, while adjacent direct-bus fallback copy now names the direct-bus evidence path.
2. The reason now says `Nearby direct bus service found`, keeping direct-bus fallback evidence distinct from ordinary bus-service support.

## DISAGREEMENTS

1. None.
