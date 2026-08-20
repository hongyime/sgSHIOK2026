# P224 Beyond-Range Walk Wording

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
   Start at  05:17:51
   Duration  966ms (transform 273ms, setup 0ms, import 337ms, tests 90ms, environment 1ms)
```

## Phrase Search

Command:

```powershell
rg -n "Closest connected|Closest routed" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\scripts\browser-smoke.mjs C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts
```

Output:

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:14:    expect(source).toContain("Closest connected ${label} shelter-map walk is ${formatDistance(nearestM)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:15:    expect(source).toContain("Closest connected shelter-map walk found is about ${formatDistance(nearestM)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:16:    expect(source).not.toContain("Closest routed ${label} is ${formatDistance(nearestM)}");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:17:    expect(source).not.toContain("Closest routed transit found is about ${formatDistance(nearestM)}");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:64:    expect(script).toContain("Closest connected shelter-map walk");
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:574:    summary.cardText.includes("Closest connected shelter-map walk");
C:\sgSHIOK2026\web\app\page.tsx:450:      return `Closest connected shelter-map walk found is about ${formatDistance(nearestM)} away; current scoring range is 1.2 km.`;
C:\sgSHIOK2026\web\app\page.tsx:702:      ? [`Closest connected ${label} shelter-map walk is ${formatDistance(nearestM)}`, "Current scoring range is 1.2 km"]
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

1. The beyond-range no-transit state still described the found evidence as `Closest routed transit`, even though the user-facing product frame is a connected shelter-map walk to transit.
2. Browser-smoke QA also keyed that no-transit state on the old phrase, so the QA text marker needed the same wording update.

## DISAGREEMENTS

1. None.
