# P47 Heat-Proxy Copy

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

## Heat Copy Term Check

Command:

```powershell
rg -n "Heat proxy: shelter \+ sparse NParks greenery|Heat proxy evidence|Heat: shelter \+ NParks shade proxy|Score evidence: covered" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx; "EXIT=$LASTEXITCODE"
```

Output:

```text
C:\sgSHIOK2026\web\app\page.tsx:1078:      ? `Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}; greenery proxy ${formatDistance(score.paths.shade_m)}.`
C:\sgSHIOK2026\web\app\page.tsx:1903:            <p className={styles.heatLine}>Heat proxy: shelter + sparse NParks greenery</p>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:223:    expect(html).toContain("Heat proxy evidence: covered 149 m; greenery proxy 23 m.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:40:    expect(source).toContain("Heat proxy: shelter + sparse NParks greenery");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:42:    expect(source).not.toContain("Heat: shelter + NParks shade proxy");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:113:    expect(source).toContain("Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}");
EXIT=0
```

## Diff Stat

Command:

```powershell
git diff --stat
```

Output:

```text
 .agents/STATE.md                                | 5 +++--
 decisions.md                                    | 3 +++
 web/app/page.tsx                                | 4 ++--
 web/lib/__tests__/accessibility-render.test.tsx | 2 +-
 web/lib/__tests__/score-card-copy.test.ts       | 4 +++-
 5 files changed, 12 insertions(+), 6 deletions(-)
```

## Verification

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  20 passed (20)
   Start at  13:57:19
   Duration  1.92s (transform 901ms, setup 0ms, import 1.19s, tests 258ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx
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
   Start at  13:57:31
   Duration  6.57s (transform 4.71s, setup 0ms, import 6.29s, tests 7.38s, environment 11ms)

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

1. The title-card heat line still said `Heat: shelter + NParks shade proxy`, which was too strong after P5/P23 established that current heat evidence is covered-walkway dominated with only sparse NParks greenery proxy support.
2. The route-detail note said generic `Score evidence` for covered metres plus greenery proxy metres. That now says `Heat proxy evidence`, matching the limited evidence source.
3. API credentials remain absent from this shell, so the OneMap/LTA measurement track is still gated. This task stayed free-tier: no API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None for P47.
