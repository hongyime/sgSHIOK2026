# P122 Data Freshness Title Copy

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
The title-card freshness line now starts with `Data freshness:` instead of `Source freshness audit:` and keeps the measured counts plus every named stale source.
```

## Validation

```text
npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  21:36:29
   Duration  610ms (transform 76ms, setup 0ms, import 98ms, tests 33ms, environment 0ms)

npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  21:36:37
   Duration  5.63s (transform 3.78s, setup 0ms, import 5.27s, tests 8.05s, environment 10ms)

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

1. The title card still exposed the internal label `Source freshness audit` even though the line is a user-facing product disclosure.

## DISAGREEMENTS

1. None.
