# P154 Live Preview Provenance Shelter Map

## Scope

Free-tier browser provenance-copy/test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

Live clicked-stop preview records now store the provenance reason `Clicked transit POI has shelter map evidence only; published scores come from the score bundle.` instead of route-evidence-first wording.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:33:17
   Duration  8.34s (transform 4.33s, setup 0ms, import 6.17s, tests 11.45s, environment 12ms)
```

`git diff --check`

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

`git diff -- pipeline/config/weights.yaml`

```text
```

`python scripts/check_repo_integrity.py; "exit=$LASTEXITCODE"`

```text
repo_integrity=ok
exit=0
```

## Findings

1. Live preview score records still carried route-evidence-first provenance text even though visible preview copy and the score-card live status had moved to shelter-map evidence.

## Disagreements

1. None.
