# P821 Graph-Disconnected Transit Copy

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
4e1f14bf7da731fe0e9cb2f4c0cb19a2dc538363
4e1f14bf7da731fe0e9cb2f4c0cb19a2dc538363	refs/heads/main
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deploy, or public-data write.
Protected diff guard was empty before edits.
```

## Ignore Check

```text
exit=1
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  07:54:40
   Duration  3.25s (transform 1.15s, setup 0ms, import 1.47s, tests 791ms, environment 1ms)
```

## Diff Check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Protected Diff Guard

```text
```

## Change

```text
Graph-disconnected no-transit browser copy now says "Transit stop or exit found" and "Transit stops or exits exist..." rather than the generic "Transit target" wording.
```

## Findings

1. The graph-disconnected no-transit copy had regressed to generic "transit target" language even though the product decision is to describe the concrete user-facing entity: a transit stop or exit.
2. The fix is browser-copy-only and does not change scoring, export, rescore, protected payloads, checksums, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
