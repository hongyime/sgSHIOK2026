# P83 planning-area rank disclosure

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P83-planning-area-ranks.md; "exit_code=$LASTEXITCODE"
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
   Start at  18:52:56
   Duration  2.79s (transform 1.49s, setup 0ms, import 1.94s, tests 322ms, environment 1ms)
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
   Start at  18:53:09
   Duration  7.89s (transform 4.59s, setup 0ms, import 5.62s, tests 11.16s, environment 23ms)
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
git diff --check
```

Output:

```text
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

1. The rank panel fetches records by the selected postal's planning-area shard and split shard parts, but the visible helper previously called this only `local ranks`; P83 changes the visible, loading, empty, and screen-reader rank copy to say `planning-area`.
2. P83 is browser presentation only. It does not alter ranking order, scoring, exports, inputs, public data, deployment, or locked weights.
3. Pipeline execution cost for P83 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
