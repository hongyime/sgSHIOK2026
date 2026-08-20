# P149 Preview Live Status Shelter Map

## Scope

Free-tier copy/accessibility change only. No scoring, export, rescore, subset run, ingest, network build, deploy, or live-site repoint.

## Change

The clicked-stop preview live region now says `Preview shelter map evidence selected.` instead of `Preview route evidence selected.` so the preview branch matches the shelter-map framing already used by the visible preview badge and panel copy.

## Verification

`npm --prefix web test`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:15:12
   Duration  8.66s (transform 4.01s, setup 0ms, import 5.06s, tests 12.08s, environment 14ms)
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

1. The preview-route live status was the last searched instance of the old `Preview route evidence selected.` copy.

## Disagreements

1. None.
