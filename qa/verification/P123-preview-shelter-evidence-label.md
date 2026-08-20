# P123 Preview Shelter Evidence Label

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
Clicked-stop preview metric label changed from `Sheltered evidence` to `Shelter evidence`.
```

## Validation

```text
npm --prefix web test -- route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:39:31
   Duration  1.43s (transform 510ms, setup 0ms, import 153ms, tests 504ms, environment 1ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:39:45
   Duration  10.05s (transform 6.16s, setup 0ms, import 8.79s, tests 14.08s, environment 20ms)

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

1. The clicked-stop preview summary still rendered the awkward metric label `Sheltered evidence` while the rest of the app frames the same value as route shelter evidence.

## DISAGREEMENTS

1. None.
