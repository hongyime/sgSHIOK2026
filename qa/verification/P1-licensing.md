# P1 Licensing Verification

Date: 2026-08-11
Base SHA: 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a

This file records command-backed evidence for the P1 licensing and attribution
task. This task changed no scores, no generated artifacts, no pipeline behavior,
and no deployment state.

## Findings

- None at implementation time.

## Disagreements

- None.

## Evidence

### 1. Base ancestry and pipeline diff

Command:

```powershell
git merge-base --is-ancestor 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a HEAD; if ($LASTEXITCODE -eq 0) { 'base_is_ancestor=true' } else { 'base_is_ancestor=false' }
```

Output:

```text
base_is_ancestor=true
```

Command:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD | & 'C:\Program Files\Git\usr\bin\grep.exe' '^pipeline/'; if ($LASTEXITCODE -eq 1) { 'NO_MATCH' }
```

Output:

```text
NO_MATCH
```

Command:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD -- pipeline/config/weights.yaml; if ($LASTEXITCODE -eq 0) { 'weights_diff_command_exit=0' }
```

Output:

```text
weights_diff_command_exit=0
```

### 2. NOTICE covers shipped sources

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

### 3. OpenStreetMap attribution appears in required files

Command:

```powershell
& 'C:\Program Files\Git\usr\bin\grep.exe' -c 'OpenStreetMap contributors' web/app/page.tsx ATTRIBUTION.md NOTICE
```

Output:

```text
web/app/page.tsx:1
ATTRIBUTION.md:2
NOTICE:1
```

### 4. OneMap logo in built output and rendered page HTML

Command:

```powershell
npm --prefix web run build
```

Output:

```text
using local data bundle C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.js took 17ms
✓ Compiled successfully in 276ms
Finished TypeScript in 354ms ...
✓ Generating static pages using 7 workers (6/6) in 558ms

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
web\.next\server\chunks\ssr\[root-of-the-server]__1rei7-x._.js
web\.next\server\app\index.html
web\.next\server\chunks\ssr\[root-of-the-server]__1rei7-x._.js.map
```

Command:

```powershell
$html = Get-Content web\.next\server\app\index.html -Raw; 'oneMapAttribution=' + ($html -match 'oneMapAttribution'); 'om_logo=' + ($html -match 'https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png'); 'OpenStreetMap contributors=' + ($html -match 'OpenStreetMap contributors'); 'compact_toggle=' + ($html -match 'maplibregl-ctrl-attrib-button')
```

Output:

```text
oneMapAttribution=True
om_logo=True
OpenStreetMap contributors=True
compact_toggle=False
```

Command:

```powershell
$html = Get-Content web\.next\server\app\index.html -Raw; $m=[regex]::Match($html,'<div class="[^\"]*oneMapAttribution[^\"]*">.*?</div>'); $m.Value
```

Output:

```html
<div class="route-evidence-map-module__nibUKW__oneMapAttribution"><img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a></div>
```

Command:

```powershell
$html = Get-Content web\.next\server\app\index.html -Raw; $m=[regex]::Match($html,'<p class="[^\"]*sourceLine[^\"]*">.*?</p>'); $m.Value
```

Output:

```html
<p class="page-module__E0kJGG__sourceLine">Sources: LTA/data.gov.sg, OneMap/SLA, © OpenStreetMap contributors (<a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a>).<!-- --> <a href="https://github.com/hongyime/sgSHIOK2026/blob/main/ATTRIBUTION.md" target="_blank" rel="noopener noreferrer">ATTRIBUTION.md</a></p>
```

### 5. Web tests

Command:

```powershell
npm --prefix web test
```

Output:

```text
RUN  v4.1.10 C:/shiok/web

Test Files  17 passed (17)
Tests       90 passed (90)
Duration    658ms
```

Comparison requested by acceptance: this run is 90 web tests across 17 files,
up from the supplied 82 tests across 15 files.

### 6. Python tests

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
============================ 315 passed in 17.15s =============================
```

Comparison requested by acceptance: this remains 315 Python tests, matching the
supplied 315 baseline.

### 7. Verification file is tracked and not ignored

Command:

```powershell
git ls-files qa/verification/P1-licensing.md; git check-ignore -v --no-index qa/verification/P1-licensing.md; if ($LASTEXITCODE -ne 0) { "not ignored (exit $LASTEXITCODE)" }
```

Output:

```text
qa/verification/P1-licensing.md
not ignored (exit 1)
```

### 8. Changed files

Command:

```powershell
git diff --name-only 07eafd39728aa884fcdd51b4f8b04184f5bb8e8a..HEAD | Sort-Object
```

Output:

```text
ATTRIBUTION.md
decisions.md
NOTICE
qa/verification/P1-audit.md
qa/verification/P1-licensing.md
qa/verification/P1-research.md
README.md
web/app/page.module.css
web/app/page.tsx
web/components/route-evidence-map.module.css
web/components/route-evidence-map.tsx
web/lib/__tests__/score-card-copy.test.ts
```
