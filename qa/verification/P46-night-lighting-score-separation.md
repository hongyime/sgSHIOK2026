# P46 Night-Lighting Score Separation

## Root Guard

Command:

```powershell
$expected = 'C:\sgSHIOK2026'
$actual = (Get-Location).Path
$hostName = $env:COMPUTERNAME
if ($actual -ne $expected) { throw "ABORT: working directory is $actual, expected $expected" }
"ROOT=$actual"
"HOST=$hostName"
```

Output:

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Credential Gate

Command:

```powershell
"ONEMAP_EMAIL_PRESENT=$([bool]$env:ONEMAP_EMAIL) LENGTH=$($env:ONEMAP_EMAIL.Length)"
"ONEMAP_PASSWORD_PRESENT=$([bool]$env:ONEMAP_PASSWORD) LENGTH=$($env:ONEMAP_PASSWORD.Length)"
"LTA_DATAMALL_ACCOUNT_KEY_PRESENT=$([bool]$env:LTA_DATAMALL_ACCOUNT_KEY) LENGTH=$($env:LTA_DATAMALL_ACCOUNT_KEY.Length)"
```

Output:

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## UI Term Check

Command:

```powershell
rg -n "night-lighting-layer-note|Map evidence only; not part of the locked score|LTA lamp post locations; map evidence only" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts; "EXIT=$LASTEXITCODE"
```

Output:

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:49:    expect(pageSource).toContain("night-lighting-layer-note");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:50:    expect(pageSource).toContain("LTA lamp post locations; map evidence only, not part of the locked score");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:51:    expect(pageSource).toContain("Map evidence only; not part of the locked score.");
C:\sgSHIOK2026\web\app\page.tsx:1909:                aria-describedby="night-lighting-layer-note"
C:\sgSHIOK2026\web\app\page.tsx:1910:                title="LTA lamp post locations; map evidence only, not part of the locked score"
C:\sgSHIOK2026\web\app\page.tsx:1917:            <p id="night-lighting-layer-note" className={styles.layerNote}>
C:\sgSHIOK2026\web\app\page.tsx:1918:              Map evidence only; not part of the locked score.
EXIT=0
```

## Diff Stat

Command:

```powershell
git diff --stat
```

Output:

```text
 .agents/STATE.md                                         | 5 +++--
 decisions.md                                             | 3 +++
 web/app/page.module.css                                  | 3 ++-
 web/app/page.tsx                                         | 6 +++++-
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 4 +++-
 5 files changed, 16 insertions(+), 5 deletions(-)
```

## Verification

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/route-evidence-map-interaction.test.ts
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  13:52:04
   Duration  1.46s (transform 555ms, setup 0ms, import 183ms, tests 519ms, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts
```

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  119 passed (119)
   Start at  13:52:16
   Duration  7.41s (transform 4.00s, setup 0ms, import 5.92s, tests 9.03s, environment 9ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

Command:

```powershell
node C:\sgSHIOK2026\web\node_modules\typescript\bin\tsc -p C:\sgSHIOK2026\web\tsconfig.json --noEmit --pretty false
```

Output:

```text
```

Command:

```powershell
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; "EXIT=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
EXIT=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

Command:

```powershell
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml; "EXIT=$LASTEXITCODE"
```

Output:

```text
EXIT=0
```

## FINDINGS

1. The `Night lighting` toggle exposed lamp-post evidence as a map layer, but the visible UI did not explicitly say that it is not part of the locked SHIOK score. The button is now linked to visible note text that says `Map evidence only; not part of the locked score.`
2. API credentials remain absent from this shell, so the OneMap/LTA measurement track is still gated. This task stayed free-tier: no API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None for P46.
