# P153 Score Coverage Shelter Map

## Scope

Free-tier browser disclosure copy/test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

The manifest-derived bundle availability line now says `full scores` and `partial shelter-map evidence` instead of `full route scores` and `partial route evidence`, preserving the same manifest counts and missing-score breakdown.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:30:03
   Duration  5.06s (transform 3.03s, setup 0ms, import 4.24s, tests 6.39s, environment 9ms)
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

1. The score-coverage disclosure still used route-evidence wording even though the product framing now treats the bundle as shelter-map-first with the locked score secondary.

## Disagreements

1. None.
