# P124 Preview Bundle Inclusion Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Scope

```text
No scoring, export, rescore, subset run, ingest, network build, deployment, public data mutation, protected QA mutation, or weights.yaml edit was performed.
```

## Change

```text
Clicked-stop preview rendered note now says the stop has route evidence but is not part of the published score bundle yet. Live preview provenance now says published SHIOK scores come from the score bundle.
```

## Validation

```text
npm --prefix web test -- accessibility-render.test.tsx live-route-scoring.test.ts route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx live-route-scoring.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  28 passed (28)
   Start at  21:43:43
   Duration  1.37s (transform 1.17s, setup 0ms, import 1.23s, tests 677ms, environment 1ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:43:53
   Duration  5.10s (transform 2.87s, setup 0ms, import 4.63s, tests 6.79s, environment 9ms)

git diff --check; "exit=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit=0

git diff -- pipeline/config/weights.yaml; "exit=$LASTEXITCODE"
exit=0

python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## FINDINGS

1. Clicked-stop preview copy still framed the limitation as `not an authoritative SHIOK score`, which is less concrete than saying the route evidence is not part of the published score bundle yet.

## DISAGREEMENTS

1. None.
