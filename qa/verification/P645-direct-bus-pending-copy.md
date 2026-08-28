# P645 Direct Bus Reason Copy

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

### First Focused Render And Source Test

```text
 FAIL  lib/__tests__/accessibility-render.test.tsx > rendered accessibility output > renders direct bus fallback evidence instead of a false low-bus verdict
AssertionError: expected '<section class="_scoreCard_00c8fe" ar…' to contain 'Direct bus evidence found; shelter-ma…'

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 54 passed (55)
   Start at  11:16:03
   Duration  5.31s (transform 1.79s, setup 0ms, import 2.24s, tests 1.30s, environment 1ms)
```

### Focused Render And Source Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  11:18:45
   Duration  5.78s (transform 1.93s, setup 0ms, import 2.43s, tests 1.46s, environment 1ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  11:19:14
   Duration  66.08s (transform 3.14s, setup 0ms, import 6.30s, tests 26.65s, environment 20ms)
```

### Python Collection

```text
457 tests collected in 16.35s
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

1. The visible direct-bus fallback reason chip still said `Nearby bus service without verified shelter-map walk`, which underplayed that this is the direct-bus fallback evidence path.
2. The reason chip now says `Nearby direct bus service without verified shelter-map walk`, preserving the user-facing caveat that no shelter-map walk has been verified.
3. A first attempt targeted `RouteModeControl`'s direct-bus branch, but the focused rendered test showed that branch is not reached for direct-bus fallbacks because the caller suppresses the walk-display control in that state.

## DISAGREEMENTS

1. None.
