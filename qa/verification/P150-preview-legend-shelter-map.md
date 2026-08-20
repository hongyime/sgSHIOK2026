# P150 Preview Legend Shelter Map

## Scope

Free-tier browser copy/accessibility test change only. No scoring, export, rescore, subset run, ingest, network build, deploy, live-site repoint, public data write, or locked weight change.

## Change

Clicked-stop preview map legend copy now says `Shelter map preview` instead of `Preview route`, matching the preview badge and live region that already frame clicked-stop previews as shelter-map evidence outside the published score bundle.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:19:15
   Duration  15.78s (transform 8.39s, setup 0ms, import 11.78s, tests 22.03s, environment 49ms)
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

1. The preview inline map legend still used the generic `Preview route` label after the preview badge, note, and live status had moved to shelter-map evidence language.

## Disagreements

1. None.
