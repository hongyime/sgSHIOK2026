# P90 night-lighting score separation

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P90-night-lighting-score-separation.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web test

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/route-evidence-map-interaction.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  19:22:07
   Duration  877ms (transform 343ms, setup 0ms, import 105ms, tests 331ms, environment 0ms)
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
   Start at  19:22:20
   Duration  8.50s (transform 6.46s, setup 0ms, import 8.38s, tests 11.87s, environment 16ms)
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

1. The visible and screen-reader night-lighting overlay status reported lamp-point loading/visibility but did not repeat that the overlay is map evidence outside the locked score.
2. P90 adds `Map evidence only; not part of the locked score.` to every non-off night-lighting overlay summary.
3. P90 is browser copy only. It does not alter lamp overlay data loading, tiles, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P90 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
