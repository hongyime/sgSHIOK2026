# P86 search postal hint

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P86-search-postal-hint.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web test

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  19:06:34
   Duration  670ms (transform 91ms, setup 0ms, import 114ms, tests 29ms, environment 0ms)
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
   Start at  19:06:48
   Duration  5.88s (transform 3.52s, setup 0ms, import 4.62s, tests 8.99s, environment 10ms)
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

1. The search input already accepted direct six-digit postal lookup, but the visible placeholder and accessible label said only `postal`, which was less specific than the actual direct lookup path.
2. P86 changes both to `Search address or 6-digit postal`.
3. P86 is browser copy only. It does not alter search behavior, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P86 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
