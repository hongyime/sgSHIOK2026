# P227 Browser Smoke Panel Aliases

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

## Focused Web Tests

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
   Start at  05:28:24
   Duration  956ms (transform 286ms, setup 0ms, import 352ms, tests 98ms, environment 1ms)
```

## Phrase Search

Command:

```powershell
rg -n "shelter_map_panel|route_evidence_panel|score_panel_loaded" C:\sgSHIOK2026\web\scripts\browser-smoke.mjs C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
```

Output:

```text
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:603:    shelter_map_panel_loaded: routeEvidencePanelLoaded,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:604:    route_evidence_panel_loaded: routeEvidencePanelLoaded,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:605:    score_panel_loaded: routeEvidencePanelLoaded,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:723:    shelter_map_panel_excerpt: shelterMapPanelExcerpt,
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:724:    route_evidence_panel_excerpt: shelterMapPanelExcerpt,
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:88:    expect(smokeSource).toContain("shelter_map_panel_loaded");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:89:    expect(smokeSource).toContain("shelter_map_panel_excerpt");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:53:    expect(script).toContain("shelter_map_panel_loaded");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:54:    expect(script).toContain("route_evidence_panel_loaded");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:55:    expect(script).toContain("shelter_map_panel_excerpt");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:56:    expect(script).toContain("route_evidence_panel_excerpt");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:57:    expect(script).toContain("score_panel_loaded: routeEvidencePanelLoaded");
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

1. Browser-smoke already selected the current `Shelter map panel`, but its JSON exposed only legacy route-evidence/score-panel loaded and excerpt names.
2. The new `shelter_map_panel_loaded` and `shelter_map_panel_excerpt` aliases let QA consumers use the current product surface name while preserving old fields.

## DISAGREEMENTS

1. None.
