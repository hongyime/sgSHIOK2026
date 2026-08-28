# P791 Walk Comparison Baseline Copy

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

Browser-only comparison-copy change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA payload write, or locked-weight change.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Change

The inline covered-walkway comparison now names the baseline walk. Instead of ending at `14pp lower`, it says `14pp lower than sheltered walk` when comparing the shortest walk against the displayed sheltered walk.

## Focused Web Tests

Command:

```text
npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  02:50:01
   Duration  13.65s (transform 3.84s, setup 0ms, import 4.83s, tests 3.97s, environment 2ms)
```

## Collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
625 tests collected in 49.53s
```

## Protected Diff Guard

Command:

```text
git diff --name-only | Where-Object { $_ -eq 'pipeline/config/weights.yaml' -or $_ -eq 'checksums.json' -or $_ -like 'web/public/data/*' -or $_ -like 'qa/p6_*' -or $_ -like 'qa/p7_*' -or $_ -like 'qa/p8_*' -or $_ -like 'qa/p9_*' -or $_ -like 'qa/p10_*' -or $_ -like 'qa/p11/*' -or $_ -like 'qa/releases/*' }; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
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

1. The existing comparison note exposed the percentage-point shelter difference but did not name the baseline walk after `higher` or `lower`.
2. The note now says which walk the alternate covered-walkway ratio is higher or lower than, improving interpretability without changing route selection, score values, or route data.
3. No protected paths or locked weights appear in the diff.

## DISAGREEMENTS

1. None for this phase.
