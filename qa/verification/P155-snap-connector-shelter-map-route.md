# P155 Snap Connector Shelter Map Route

## Scope

Free-tier browser copy/test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

The snap-connector route detail now says the connector links onto `the shelter-map route` instead of `mapped walking-route evidence`.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:36:20
   Duration  15.97s (transform 9.36s, setup 0ms, import 13.19s, tests 24.19s, environment 49ms)
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

1. The snap-connector helper still described the selected route as mapped walking-route evidence after the rest of the score card had moved to shelter-map route language.

## Disagreements

1. None.
