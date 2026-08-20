# P226 Browser Smoke Walk Marker

## Root Guard

Command:

```powershell
$ErrorActionPreference='Stop'; $p=(Get-Location).ProviderPath; $h=$env:COMPUTERNAME; Write-Output "cwd=$p"; Write-Output "host=$h"; if ($p -ne 'C:\sgSHIOK2026') { throw "Wrong working root: $p" }
```

Output:

```text
cwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## First Focused Test Run

Command:

```powershell
npm --prefix 'C:\sgSHIOK2026\web' test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (15 tests | 1 failed) 423ms
     × does not duplicate the sheltered % across primary and secondary rows 116ms

 FAIL  lib/__tests__/score-card-copy.test.ts > score card copy > does not duplicate the sheltered % across primary and secondary rows
ReferenceError: smokeSource is not defined
```

## Corrected Focused Test Run

Command:

```powershell
npm --prefix 'C:\sgSHIOK2026\web' test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  24 passed (24)
   Start at  05:24:58
   Duration  1.54s (transform 383ms, setup 0ms, import 483ms, tests 165ms, environment 1ms)
```

## Phrase Search

Command:

```powershell
rg -n "walk_mode_present|route_mode_present|Sheltered route|Sheltered walk" C:\sgSHIOK2026\web\scripts\browser-smoke.mjs C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts
```

Output:

```text
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:68:    expect(script).toContain("walk_mode_present");
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:637:      walk_mode_present:
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:638:        summary.cardText.includes("Sheltered walk") ||
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:640:      route_mode_present:
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:641:        summary.cardText.includes("Sheltered walk") ||
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:179:    expect(source).toContain('"Sheltered walk"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:180:    expect(source).not.toContain('"Sheltered route"');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:181:    expect(smokeSource).toContain('summary.cardText.includes("Sheltered walk")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:182:    expect(smokeSource).not.toContain('summary.cardText.includes("Sheltered route")');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:206:    expect(source).toContain('const otherLabel = viewedIsShortest ? "Sheltered walk" : "Shortest walk";');
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:207:    expect(source).not.toContain('const otherLabel = viewedIsShortest ? "Sheltered route" : "Shortest";');
```

## Repository Integrity

Command:

```powershell
uv run python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Protected Weights Diff

Command:

```powershell
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
```

## FINDINGS

1. Browser smoke still treated `Sheltered route` as the scored-panel rendered marker even though the current app renders `Sheltered walk`.
2. The first focused test run caught that the new smoke-source assertion needed to load `browser-smoke.mjs`; the corrected test now covers the QA marker.

## DISAGREEMENTS

1. None.
