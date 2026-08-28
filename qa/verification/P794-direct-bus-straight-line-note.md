# P794 Direct Bus Straight-Line Note

## Working Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Trackability

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P794-direct-bus-straight-line-note.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Focused Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  03:18:26
   Duration  3.61s (transform 1.22s, setup 0ms, import 1.59s, tests 801ms, environment 1ms)
```

## Python Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
625 tests collected in 43.63s
```

## Repository Integrity

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
PS C:\sgSHIOK2026> git diff --name-only | Where-Object { $_ -eq 'pipeline/config/weights.yaml' -or $_ -eq 'checksums.json' -or $_ -like 'web/public/data/*' -or $_ -like 'qa/p6_*' -or $_ -like 'qa/p7_*' -or $_ -like 'qa/p8_*' -or $_ -like 'qa/p9_*' -or $_ -like 'qa/p10_*' -or $_ -like 'qa/p11/*' -or $_ -like 'qa/releases/*' }; Write-Output "exit_code=$LASTEXITCODE"
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. The direct-bus fallback score card now names the fallback as a straight-line bus estimate in the visible route label, exposure sentence, gap heading, metric label, accessibility announcement, and reason list.
2. The interrupted edit had only changed a `RouteModeControl` direct-bus branch that is not rendered for direct-bus fallback because the caller guards it with `!directBusFallback`; the shipped fix also updates rendered score-card surfaces.
3. No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload mutation, or locked-weight change was performed.

## DISAGREEMENTS

1. None.
