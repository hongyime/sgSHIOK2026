# P151 Map Summary Shelter Map Route

## Scope

Free-tier browser accessibility-copy change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

The non-visual selected-route map summary now starts `Shelter map for ...` instead of `Route evidence for ...`, matching the map container label and empty-map summary.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:22:41
   Duration  10.82s (transform 5.41s, setup 0ms, import 6.76s, tests 15.53s, environment 9ms)
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

1. Selected-route map summaries still used route-evidence-first copy after the map label and empty summary had moved to shelter-map framing.

## Disagreements

1. None.
