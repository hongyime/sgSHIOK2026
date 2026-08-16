# P48 Clicked-Stop Preview Failure Disclosure

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

## Preview-State Term Check

Command:

```powershell
rg -n "liveRoutePreviewStatuses|Fetching OneMap walking preview|straight-line preview only|liveRoutePreviewStatus|setLiveRoutePreviewStatuses|OneMap live route fetch failed" C:\sgSHIOK2026\web\app\page.tsx C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx; "EXIT=$LASTEXITCODE"
```

Output:

```text
C:\sgSHIOK2026\web\app\page.tsx:753:function liveRoutePreviewStatusNote(status: LiveRoutePreviewStatus | null | undefined): string | null {
C:\sgSHIOK2026\web\app\page.tsx:755:    return "Fetching OneMap walking preview; the selected stop is shown as a straight-line preview until that route returns.";
C:\sgSHIOK2026\web\app\page.tsx:758:    return "OneMap walking preview is unavailable for this selected stop; showing straight-line preview only.";
C:\sgSHIOK2026\web\app\page.tsx:950:  liveRoutePreviewStatus = null,
C:\sgSHIOK2026\web\app\page.tsx:977:  liveRoutePreviewStatus?: LiveRoutePreviewStatus | null;
C:\sgSHIOK2026\web\app\page.tsx:1051:    ? liveRoutePreviewStatusNote(liveRoutePreviewStatus)
C:\sgSHIOK2026\web\app\page.tsx:1504:  const [liveRoutePreviewStatuses, setLiveRoutePreviewStatuses] = useState<Record<string, LiveRoutePreviewStatus>>({});
C:\sgSHIOK2026\web\app\page.tsx:1518:    setLiveRoutePreviewStatuses({});
C:\sgSHIOK2026\web\app\page.tsx:1596:      setLiveRoutePreviewStatuses((current) => {
C:\sgSHIOK2026\web\app\page.tsx:1612:      setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
C:\sgSHIOK2026\web\app\page.tsx:1618:    setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "loading" }));
C:\sgSHIOK2026\web\app\page.tsx:1625:          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
C:\sgSHIOK2026\web\app\page.tsx:1630:          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
C:\sgSHIOK2026\web\app\page.tsx:1664:        setLiveRoutePreviewStatuses((current) => {
C:\sgSHIOK2026\web\app\page.tsx:1672:        console.warn("OneMap live route fetch failed; keeping direct fallback:", err);
C:\sgSHIOK2026\web\app\page.tsx:1674:          setLiveRoutePreviewStatuses((current) => ({ ...current, [chosenStopId]: "unavailable" }));
C:\sgSHIOK2026\web\app\page.tsx:1792:    setLiveRoutePreviewStatuses({});
C:\sgSHIOK2026\web\app\page.tsx:1801:        setLiveRoutePreviewStatuses({});
C:\sgSHIOK2026\web\app\page.tsx:2024:              liveRoutePreviewStatus={chosenStopId ? liveRoutePreviewStatuses[chosenStopId] ?? null : null}
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:188:      liveRoutePreviewStatus: "unavailable",
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:194:      "OneMap walking preview is unavailable for this selected stop; showing straight-line preview only."
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:123:    expect(pageSource).toContain("liveRoutePreviewStatuses");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:124:    expect(pageSource).toContain("Fetching OneMap walking preview");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:125:    expect(pageSource).toContain("showing straight-line preview only");
EXIT=0
```

## Diff Stat

Command:

```powershell
git diff --stat
```

Output:

```text
 .agents/STATE.md                                   |  5 +-
 decisions.md                                       |  3 ++
 web/app/page.tsx                                   | 61 ++++++++++++++++++++--
 web/lib/__tests__/accessibility-render.test.tsx    | 29 ++++++++++
 .../route-evidence-map-interaction.test.ts         |  5 ++
 5 files changed, 97 insertions(+), 6 deletions(-)
```

## Verification

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test -- lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/accessibility-render.test.tsx
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  21 passed (21)
   Start at  14:04:36
   Duration  1.69s (transform 1.20s, setup 0ms, import 1.15s, tests 807ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/accessibility-render.test.tsx
```

Command:

```powershell
npm --prefix C:\sgSHIOK2026\web test
```

Output:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  120 passed (120)
   Start at  14:04:50
   Duration  6.59s (transform 5.09s, setup 0ms, import 6.70s, tests 7.80s, environment 11ms)

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

1. Clicked stops without precomputed route geometry could silently remain on the straight-line preview when OneMap routing was still loading, returned no route, returned malformed route geometry, or failed. The user-visible result card now names loading and unavailable preview states instead of relying on console output.
2. Precomputed bundle candidate routes remain authoritative: the status is cleared when a chosen stop has precomputed geometry or a returned live route.
3. API credentials remain absent from this shell, so the OneMap/LTA measurement track is still gated. This task stayed free-tier: no API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.

## DISAGREEMENTS

1. None for P48.
