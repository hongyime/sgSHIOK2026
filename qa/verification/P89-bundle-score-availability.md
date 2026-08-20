# P89 bundle score availability wording

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P89-bundle-score-availability.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web tests

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/score-coverage.test.ts lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-coverage.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  14 passed (14)
   Start at  19:18:26
   Duration  2.79s (transform 765ms, setup 0ms, import 953ms, tests 387ms, environment 4ms)
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
   Start at  19:18:45
   Duration  6.91s (transform 4.04s, setup 0ms, import 5.91s, tests 8.61s, environment 14ms)
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

1. The manifest-derived title-card disclosure started with `Score coverage`, which was accurate but score-first.
2. P89 changes the line to start `Bundle score availability`, preserving the same manifest-derived counts and breakdown.
3. P89 is browser copy only. It does not alter manifest parsing, counts, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P89 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
