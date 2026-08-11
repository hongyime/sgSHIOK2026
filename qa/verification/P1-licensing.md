# P1 Licensing Verification

Date: 2026-08-11
Base SHA: 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a

This file is intentionally command-backed. Each implementation claim below is
paired with the command output used to verify it.

## Scope

- No pipeline, pipeline configuration, regeneration, republishing, or deployment
  changes were part of this task.
- Out-of-scope findings belong in this section if encountered.

## Findings

- None at implementation time.

## Evidence

### 1. Pipeline diff from base to committed HEAD

Command:

```powershell
git rev-parse HEAD; git merge-base --is-ancestor 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a HEAD; if ($LASTEXITCODE -eq 0) { 'base_is_ancestor=true' } else { 'base_is_ancestor=false' }
```

Output:

```text
07eafd39728aa884fcdd51b4f8b04184f5bb8e8a
base_is_ancestor=true
```

Command requested by acceptance:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD | grep "^pipeline/"
```

Output:

```text
grep: The term 'grep' is not recognized as a name of a cmdlet, function, script file, or executable program.
```

PowerShell equivalent, rerun after the first commit:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD | Where-Object { $_ -match '^pipeline/' }
```

Output:

```text

```

Command:

```powershell
git diff --name-only -- pipeline; git diff -- pipeline/config/weights.yaml
```

Output:

```text

```

### 2. weights.yaml unchanged

Command:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD -- pipeline/config/weights.yaml
```

Output:

```text

```

### 3. NOTICE names every shipped source

Command:

```powershell
$sources = @('covered_linkway','overhead_bridge_underpass','bus_stops','bus_services','bus_routes','mrt_lrt_exits','train_station_codes','traffic_signals','building_points','sla_dwelling_information','ura_no_dwelling_units','planning_area_boundary','nparks_nature_ways','nparks_park_connector_loop','nparks_tracks','nparks_heritage_trees','nparks_heritage_road_green_buffers','osm_extract'); foreach ($s in $sources) { $hit = Select-String -Path NOTICE -Pattern $s -SimpleMatch -Quiet; "${s}:$hit" }
```

Output:

```text
covered_linkway:True
overhead_bridge_underpass:True
bus_stops:True
bus_services:True
bus_routes:True
mrt_lrt_exits:True
train_station_codes:True
traffic_signals:True
building_points:True
sla_dwelling_information:True
ura_no_dwelling_units:True
planning_area_boundary:True
nparks_nature_ways:True
nparks_park_connector_loop:True
nparks_tracks:True
nparks_heritage_trees:True
nparks_heritage_road_green_buffers:True
osm_extract:True
```

### 4. OpenStreetMap attribution appears in required files

Command requested by acceptance:

```powershell
grep -c "OpenStreetMap contributors" web/app/page.tsx ATTRIBUTION.md NOTICE
```

Output:

```text
grep: The term 'grep' is not recognized as a name of a cmdlet, function, script file, or executable program.
```

PowerShell equivalent:

```powershell
foreach ($path in @('web/app/page.tsx','ATTRIBUTION.md','NOTICE')) { $count = (Select-String -Path $path -Pattern 'OpenStreetMap contributors' -SimpleMatch -AllMatches).Count; "${path}:$count" }
```

Output:

```text
web/app/page.tsx:1
ATTRIBUTION.md:2
NOTICE:1
```

### 5. OneMap logo in built output and rendered DOM

Command:

```powershell
npm --prefix web run build
```

Output:

```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 13ms
✓ Compiled successfully in 740ms
Finished TypeScript in 524ms ...
✓ Generating static pages using 7 workers (6/6) in 588ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/onemap-route
├ ƒ /api/onemap-search
└ ○ /icon.svg
```

Command:

```powershell
rg -n -l "om_logo.png" web\.next | Select-Object -First 10
```

Output:

```text
web\.next\static\chunks\35_hvzx8w0ykx.js
web\.next\server\app\index.html
web\.next\server\chunks\ssr\[root-of-the-server]__1rei7-x._.js.map
web\.next\server\chunks\ssr\[root-of-the-server]__1rei7-x._.js
```

Command:

```powershell
@'
<Node CDP script: starts `next start` on 127.0.0.1:3120, opens headless Chrome, queries `[class*=oneMapAttribution]`, verifies the OneMap logo image and OneMap/SLA links, then kills the server process tree.>
'@ | node -
```

Output:

```json
{
  "ok": true,
  "status": 200,
  "imgSrc": "https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png",
  "text": " \nOneMap\n © contributors | \nSingapore Land Authority",
  "html": "<img src=\"https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png\" style=\"height:20px;width:20px;\">&nbsp;<a href=\"https://www.onemap.gov.sg/\" target=\"_blank\" rel=\"noopener noreferrer\">OneMap</a>&nbsp;©&nbsp;contributors&nbsp;|&nbsp;<a href=\"https://www.sla.gov.sg/\" target=\"_blank\" rel=\"noopener noreferrer\">Singapore Land Authority</a>",
  "visibleRect": {
    "width": 268,
    "height": 24
  },
  "compactTogglePresent": false
}
```

Command:

```powershell
@'
<Node CDP script: starts `next start`, sets headless Chrome viewport to 380x800, queries the source line and OneMap attribution dimensions, then kills the server process tree.>
'@ | node -
```

Output:

```json
{
  "ok": true,
  "viewport": {
    "width": 380,
    "height": 800
  },
  "sourceText": "Sources: LTA/data.gov.sg, OneMap/SLA, © OpenStreetMap contributors (ODbL). ATTRIBUTION.md",
  "sourceRect": {
    "width": 336,
    "height": 24
  },
  "attribRect": {
    "width": 268,
    "height": 24
  },
  "bodyScrollWidth": 380,
  "compactTogglePresent": false
}
```

### 6. Web tests and build

Command:

```powershell
npm --prefix web test
```

Output:

```text
RUN  v4.1.10 C:/shiok/web

Test Files  17 passed (17)
Tests       90 passed (90)
Duration    669ms
```

Previous comparison requested by acceptance: this run is 90 web tests across 17
files, compared to the supplied previous 82/15 baseline.

Build command and output are recorded in section 5.

### 7. Python tests

Command:

```powershell
uv run python run.py test
```

Output:

```text
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\shiok
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 315 items
...
============================ 315 passed in 16.73s =============================
```

Previous comparison requested by acceptance: this remains 315 Python tests,
matching the supplied previous 315 baseline.

### 8. Tracking / ignore status

These commands were run after staging `qa/verification/P1-licensing.md` and
rerun after commit.

Command:

```powershell
git ls-files qa/verification/P1-licensing.md
```

Output:

```text
qa/verification/P1-licensing.md
```

Command:

```powershell
git check-ignore -v --no-index qa/verification/P1-licensing.md; if ($LASTEXITCODE -ne 0) { "not ignored (exit $LASTEXITCODE)" }
```

Output:

```text
not ignored (exit 1)
```

### 9. Staged files and whitespace check

Command:

```powershell
git diff --cached --name-only
```

Output:

```text
ATTRIBUTION.md
NOTICE
README.md
decisions.md
qa/verification/P1-audit.md
qa/verification/P1-licensing.md
qa/verification/P1-research.md
web/app/page.module.css
web/app/page.tsx
web/components/route-evidence-map.module.css
web/components/route-evidence-map.tsx
web/lib/__tests__/score-card-copy.test.ts
```

Command:

```powershell
git diff --cached --check
```

Output:

```text

```
