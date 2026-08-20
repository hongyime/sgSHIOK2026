# P87 search no-results guidance

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P87-search-no-results.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web test

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  19:10:16
   Duration  2.21s (transform 931ms, setup 0ms, import 1.26s, tests 278ms, environment 0ms)
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
   Start at  19:10:34
   Duration  15.16s (transform 7.00s, setup 0ms, import 10.68s, tests 21.88s, environment 23ms)
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

1. When a submitted OneMap address search returned zero results, the UI previously showed no visible guidance.
2. P87 adds a non-alerting no-results message after submitted searches only: it suggests a six-digit postal code and reminds users that newer completions may still be outside the frozen score bundle.
3. P87 is browser behavior/copy only. It does not alter OneMap query behavior, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P87 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
