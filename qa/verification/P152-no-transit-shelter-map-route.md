# P152 No Transit Shelter Map Route

## Scope

Free-tier browser copy/test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

Graph-disconnected no-transit notes now say `this shelter-map bundle has no connected walking route yet` instead of `this bundle has no connected walking route evidence yet`.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:26:16
   Duration  16.85s (transform 8.67s, setup 0ms, import 13.58s, tests 16.91s, environment 26ms)
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

1. The graph-disconnected note still framed the missing route as generic walking-route evidence instead of a shelter-map bundle route gap.

## Disagreements

1. None.
