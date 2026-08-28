# P642 Exposed Gap Coordinate Grammar

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

### Focused Render Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  37 passed (37)
   Start at  10:56:17
   Duration  4.53s (transform 1.87s, setup 0ms, import 2.28s, tests 1.29s, environment 1ms)
```

### First Full Web Run

```text
 Test Files  1 failed | 23 passed (24)
      Tests  1 failed | 163 passed (164)
   Start at  10:56:52
   Duration  50.05s (transform 2.29s, setup 0ms, import 4.40s, tests 25.62s, environment 14ms)
```

The failure was `lib/__tests__/score-card-copy.test.ts > score card copy > puts data freshness and heat proxy copy in the title card`; its source guard still expected the old unconditional `include map coordinates.` text. The guard now pins the conditional `"includes" : "include"` branch.

### Focused Render And Source Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  53 passed (53)
   Start at  10:58:04
   Duration  11.68s (transform 4.27s, setup 0ms, import 5.11s, tests 3.46s, environment 2ms)
```

### Full Web Tests

```text
 Test Files  24 passed (24)
      Tests  164 passed (164)
   Start at  10:58:51
   Duration  51.52s (transform 2.81s, setup 0ms, import 5.15s, tests 21.47s, environment 10ms)
```

### Python Collection

```text
457 tests collected in 27.47s
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

1. The exposed-gap coordinate summary used plural verb grammar for the one-gap case: `1 of 1 exposed gap include map coordinates.`
2. The summary now uses `includes` when exactly one coordinate-backed exposed gap is reported, preserving `include` for plural counts.
3. The first full web run caught a stale source-copy guard that expected the old unconditional verb phrase; the corrected guard now pins both branches of the conditional grammar.

## DISAGREEMENTS

1. None.
