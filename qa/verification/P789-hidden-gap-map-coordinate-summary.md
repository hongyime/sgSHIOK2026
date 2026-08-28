# P789 Hidden Gap Map Coordinate Summary

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

Browser-only product copy/test change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA payload write, or locked-weight change.

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
8a43f0c2620bd69d54f06ff847dcd62b7f44ef42
8a43f0c2620bd69d54f06ff847dcd62b7f44ef42	refs/heads/main
```

## Evidence Path Ignore Check

```text
exit_code=1
```

## Change

The hidden exposed-gap disclosure now reports how many collapsed shorter gaps carry map coordinates, so a user can see that hidden gap evidence remains focusable on the map before opening the disclosure.

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
   Start at  02:37:22
   Duration  6.11s (transform 1.46s, setup 0ms, import 1.70s, tests 567ms, environment 5ms)
```

## Collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
625 tests collected in 47.51s
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

1. Hidden exposed gaps were already available below a disclosure and individually focusable when they had coordinates, but the collapsed summary did not disclose that map-coordinate affordance.
2. The change keeps the first three exposed gaps visible and makes only the hidden-gap summary more specific.
3. No protected paths or locked weights appear in the diff.

## DISAGREEMENTS

1. None for this phase.
