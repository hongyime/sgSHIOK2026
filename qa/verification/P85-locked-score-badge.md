# P85 locked-score badge label

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P85-locked-score-badge.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web tests

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  23 passed (23)
   Start at  19:02:02
   Duration  2.13s (transform 1.17s, setup 0ms, import 1.53s, tests 259ms, environment 1ms)
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
   Start at  19:02:17
   Duration  10.52s (transform 4.04s, setup 0ms, import 6.14s, tests 13.67s, environment 11ms)
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

1. The header score badge was visually secondary by size, but it showed a bare `72/100`-style number without an adjacent visible label.
2. P85 adds a `Locked score` label inside the badge and keeps the score number at 13px while the shelter evidence headline remains 17px.
3. P85 is browser presentation only. It does not alter published scores, ranking, scoring, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P85 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
