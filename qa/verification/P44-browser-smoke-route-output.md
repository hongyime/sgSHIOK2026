# P44 Browser Smoke Route Output

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

## Consumer Search

Command:

```powershell
rg -n "score_panel_loaded|score_panel_excerpt|score_panel|Route evidence panel|route_evidence_panel" "C:\sgSHIOK2026\web\scripts" "C:\sgSHIOK2026\web\lib\__tests__" "C:\sgSHIOK2026\scripts"
```

Output:

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:143:    expect(html).toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:165:    expect(html).toContain('aria-label="Route evidence panel"');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:64:    expect(script).toContain('section[aria-label="Route evidence panel"]');
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:525:      const card = document.querySelector('section[aria-label="Route evidence panel"]');
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:602:    score_panel_loaded: summary.cardText.includes(`Postal ${postal}`),
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:711:    score_panel_excerpt: summary.cardText.split("\n").slice(0, 32),
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

## Diff Stat

Command:

```powershell
git diff --stat
```

Output:

```text
 .agents/STATE.md                     | 5 +++--
 decisions.md                         | 3 +++
 web/lib/__tests__/deployment.test.ts | 3 +++
 web/scripts/browser-smoke.mjs        | 8 ++++++--
 4 files changed, 15 insertions(+), 4 deletions(-)
```

## Verification

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/deployment.test.ts
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  13:41:19
   Duration  3.12s (transform 497ms, setup 0ms, import 582ms, tests 70ms, environment 3ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/deployment.test.ts
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
   Start at  13:41:43
   Duration  9.99s (transform 7.09s, setup 0ms, import 9.28s, tests 13.57s, environment 18ms)

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
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml; "EXIT=$LASTEXITCODE"
```

Output:

```text
EXIT=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

## FINDINGS

1. Browser smoke had already switched to querying the `Route evidence panel`, but its JSON output still exposed canonical `score_panel_loaded` and `score_panel_excerpt` names. P44 makes `route_evidence_panel_loaded` and `route_evidence_panel_excerpt` canonical while keeping the old keys as compatibility aliases.
2. API credentials remain absent from this shell, so the OneMap/LTA measurement track is still gated. This task stayed free-tier: no API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None for P44. The compatibility-alias choice is intentional because browser smoke summary JSON is a QA artifact schema and older evidence/scripts may still read the old keys.
