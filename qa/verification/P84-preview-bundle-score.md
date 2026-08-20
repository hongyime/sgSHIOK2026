# P84 preview bundle-score disclosure

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
git check-ignore -v C:\sgSHIOK2026\qa\verification\P84-preview-bundle-score.md; "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## Focused web tests

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  22 passed (22)
   Start at  18:58:14
   Duration  4.10s (transform 3.21s, setup 0ms, import 2.81s, tests 1.87s, environment 1ms)
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
   Start at  18:58:32
   Duration  9.18s (transform 4.47s, setup 0ms, import 6.49s, tests 12.49s, environment 16ms)
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

1. The clicked-stop preview summary previously rendered `Score status: Not scored`, even though the more precise product state is that the route evidence is preview-only and outside the published score bundle.
2. P84 changes that metric to `Bundle score: Preview only` and adds a rendered assertion for the user-visible copy.
3. P84 is browser presentation only. It does not alter live-route scoring logic, published scores, ranking, exports, inputs, public data, deployment, or locked weights.
4. Pipeline execution cost for P84 is zero: no scoring, export, rescore, subset run, ingest, or network build was run.

## DISAGREEMENTS

1. None.
