# P790 Active Gap Selected Label

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

Browser-only exposed-gap state copy. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA payload write, or locked-weight change.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Change

When an exposed gap is focused on the map, its row now says `Selected on map` instead of continuing to say `Focus on map`. Unselected coordinate-backed gaps keep the existing `Focus on map` action label.

## Focused Web Test

Command:

```text
npm --prefix web test -- score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  02:41:27
   Duration  1.35s (transform 245ms, setup 0ms, import 296ms, tests 151ms, environment 1ms)
```

## Collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
625 tests collected in 15.37s
```

## Protected Diff Guard

Command:

```text
git diff --name-only | Where-Object { $_ -eq 'pipeline/config/weights.yaml' -or $_ -eq 'checksums.json' -or $_ -like 'web/public/data/*' -or $_ -like 'qa/p6_*' -or $_ -like 'qa/p7_*' -or $_ -like 'qa/p8_*' -or $_ -like 'qa/p9_*' -or $_ -like 'qa/p10_*' -or $_ -like 'qa/p11/*' -or $_ -like 'qa/releases/*' }; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## Repository Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. Focused exposed-gap rows already had active styling and `aria-pressed`, but the visible action label did not change after selection.
2. The active row now says `Selected on map`, keeping the map-focus state visible without changing route data or score values.
3. No protected paths or locked weights appear in the diff.

## DISAGREEMENTS

1. None for this phase.
