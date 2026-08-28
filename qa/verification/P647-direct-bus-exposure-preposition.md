# P647 Direct Bus Exposure Preposition

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
 FAIL  lib/__tests__/score-card-copy.test.ts > score card copy > puts data freshness and heat proxy copy in the title card
AssertionError: expected '"use client";\n\nimport React, { useC…' to contain 'Exposed gaps on {selectedWalkLabel}'

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 54 passed (55)
   Start at  11:29:22
   Duration  10.55s (transform 4.03s, setup 0ms, import 4.72s, tests 2.38s, environment 1ms)
```

### Focused Render And Source Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  11:29:55
   Duration  5.74s (transform 1.90s, setup 0ms, import 2.35s, tests 1.28s, environment 2ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  11:30:26
   Duration  80.10s (transform 3.82s, setup 0ms, import 7.51s, tests 31.34s, environment 20ms)
```

### Python Collection

```text
457 tests collected in 17.52s
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

1. After P646, direct-bus fallback exposure copy could render `62% covered-walkway ratio on the direct bus service estimate.`, which still sounded like a displayed walk rather than a service estimate.
2. Direct-bus fallback exposure copy now uses `for the direct bus service estimate`, and its exposed-gap heading uses `for direct bus service estimate`; ordinary sheltered/shortest/preview walk copy keeps the existing `on` wording.
3. The first focused test run caught a stale source-copy guard that still expected the old hard-coded `Exposed gaps on {selectedWalkLabel}` heading; the corrected guard now pins the heading phrase variable.

## DISAGREEMENTS

1. None.
