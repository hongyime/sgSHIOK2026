# P248 clicked-stop shelter-map bundle wording

Root: `C:\sgSHIOK2026`
Host: `PRAWN-E14`
Date: 2026-08-21

## Scope

Clicked-stop live previews still used `published score bundle` wording in user-facing copy and preview provenance. This phase keeps the clicked-stop caveat but names the published artifact as the shelter-map bundle and avoids claiming full provenance for the legacy published bundle.

No scoring, export, rescore, subset run, ingest, network build, deployment, input mutation, public-data mutation, or locked weight change was run.

## Commands

```text
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/live-route-scoring.test.ts lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/accessibility-render.test.tsx
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/live-route-scoring.test.ts lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  32 passed (32)
   Start at  07:12:12
   Duration  7.55s (transform 5.64s, setup 0ms, import 6.31s, tests 3.95s, environment 1ms)
```

```text
rg -n "published score bundle with locked weights and full provenance|published scores come from the score bundle|not part of the published score bundle yet" C:\sgSHIOK2026\web\app C:\sgSHIOK2026\web\lib --glob '!**/__tests__/**'; Write-Output "exit=$LASTEXITCODE"
```

```text
exit=1
```

## FINDINGS

1. Clicked-stop preview copy still described the preview as outside the published `score bundle`, which was inconsistent with P247's operator-facing shelter-map bundle wording.
2. The live-preview helper comment also still said authoritative scores came from a published score bundle with full provenance, which overclaimed provenance for the legacy published artifact.
3. The clicked-stop preview note and provenance reason now name the shelter-map bundle while preserving that only published locked scores are authoritative.

## DISAGREEMENTS

1. None.
