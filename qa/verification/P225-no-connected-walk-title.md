# P225 No Connected Walk Title

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

## Focused Web Test

Command:

```powershell
npm --prefix 'C:\sgSHIOK2026\web' test -- --run lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  05:20:51
   Duration  705ms (transform 101ms, setup 0ms, import 134ms, tests 56ms, environment 0ms)
```

## Phrase Search

Command:

```powershell
rg -n "No connected|No routed \$\{transitModeLabel|No routed" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\scripts\browser-smoke.mjs
```

Output:

```text
C:\sgSHIOK2026\web\app\page.tsx:430:    : `No connected ${transitModeLabel(transitMode)} shelter-map walk within range`;
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:570:    summary.cardText.includes("No routed") ||
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:652:        !summary.cardText.includes("No Transit Found Nearby") && !summary.cardText.includes("No routed transit"),
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:10:    expect(source).toContain("No connected ${transitModeLabel(transitMode)} shelter-map walk within range");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:19:    expect(source).not.toContain("No routed ${transitModeLabel(transitMode)} within range");
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

1. The generic no-transit fallback title still said `No routed [transit target] within range`; rendered product copy should describe the missing artifact as a connected shelter-map walk.
2. Browser-smoke keeps broad `No routed` legacy detection for older/deployed pages, but current app source now guards against the rendered fallback title regressing.

## DISAGREEMENTS

1. None.
