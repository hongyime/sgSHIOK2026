# P88 sheltered route label

## Startup guard

Command:

```powershell
$ErrorActionPreference='Stop'; $cwd=(Get-Location).Path; $hostName=$env:COMPUTERNAME; "cwd=$cwd"; "hostname=$hostName"; if ($cwd -ne 'C:\sgSHIOK2026') { throw "ABORT: working directory must be C:\sgSHIOK2026" }
```

Output:

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Evidence path ignore check

Command:

```powershell
git check-ignore -v C:\sgSHIOK2026\qa\verification\P88-sheltered-route-label.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web tests

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  19:14:42
   Duration  1.09s (transform 401ms, setup 0ms, import 241ms, tests 389ms, environment 1ms)
```

## Full web test suite

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  123 passed (123)
   Start at  19:14:55
   Duration  6.87s (transform 4.14s, setup 0ms, import 5.43s, tests 9.88s, environment 10ms)
```

## Repository integrity

Command:

```powershell
python scripts/check_repo_integrity.py; "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

## Diff whitespace check

Command:

```powershell
git diff --check; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=0
```

## Locked weights check

Command:

```powershell
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
```

## FINDINGS

1. The route selector and legend previously used `Covered` / `Covered route` / `Covered walk` for the selected higher-shelter route, which could imply the entire walk is covered even when the visible shelter ratio is partial.
2. P88 changes user-facing route labels to `Sheltered`, `Sheltered route`, and `Sheltered walk`, while keeping the measured coverage percentage as the authority.
3. P88 is browser copy only. It does not alter route selection behavior, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P88 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
