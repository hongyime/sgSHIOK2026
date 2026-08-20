# P249 transit picker shelter-map bundle wording

Root: `C:\sgSHIOK2026`
Host: `PRAWN-E14`
Date: 2026-08-21

## Scope

The browser nearest-transit helper still described the point-to-point picker limitation as a `current score bundle` limitation. This phase changes that developer-facing browser comment to `current shelter-map bundle` and adds a source guard in the existing transit picker test file.

No scoring, export, rescore, subset run, ingest, network build, deployment, input mutation, public-data mutation, or locked weight change was run.

## Commands

```text
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/transit-stop-picker.test.tsx
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  32 passed (32)
   Start at  07:17:14
   Duration  1.29s (transform 380ms, setup 0ms, import 541ms, tests 97ms, environment 0ms)
```

```text
rg -n "The current score bundle does NOT ship a ranked candidate list|published score bundle with locked weights and full provenance|published scores come from the score bundle|not part of the published score bundle yet" C:\sgSHIOK2026\web\app C:\sgSHIOK2026\web\lib --glob '!**/__tests__/**'; Write-Output "exit=$LASTEXITCODE"
```

```text
exit=1
```

## FINDINGS

1. The nearest-transit helper still described the current artifact as a score bundle even though the limitation is about what the shelter-map bundle ships for alternate transit stops.
2. The comment now uses shelter-map bundle wording while preserving the straight-line-only limitation for non-best candidates.

## DISAGREEMENTS

1. None.
