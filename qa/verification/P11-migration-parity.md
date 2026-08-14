$ Set-Location -LiteralPath 'X:\01 REPOSITORIES\sgSHIOK2026'; Get-Location

Path
----
X:\01 REPOSITORIES\sgSHIOK2026

$ hostname
Prawn-E14

$ Get-CimInstance Win32_Processor | Select-Object -First 1 Name,NumberOfCores,NumberOfLogicalProcessors | ConvertTo-Json -Compress; Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory | ConvertTo-Json -Compress
{"Name":"Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz","NumberOfCores":4,"NumberOfLogicalProcessors":8}
{"TotalPhysicalMemory":16942411776}

$ git check-ignore -v qa/verification/P11-migration-parity.md; "check_ignore_exit=$LASTEXITCODE"
check_ignore_exit=1

$ git rev-parse HEAD
cf3879c7d8c7113bd39acabd54542365c1e66e0a

$ git status --porcelain
?? qa/p10_network_provenance_20260813/
?? qa/p8_provenance_repair_20260813/
?? qa/verification/P11-migration-parity.md

$ git log --oneline -5
cf3879c docs: track agent handoff state
8014acf docs: capture T14 machine baseline for migration
5346ad6 test: record P10 provenance verification
1ed27b0 ci: run repo integrity tripwire daily
d78a0a3 feat: fingerprint scoring network provenance

$ Get-Item uv.lock | Select-Object FullName,Length | Format-List; Get-FileHash uv.lock -Algorithm SHA256 | Format-List; 'expected_sha256=032f0b86ca392342fd18a2a83624caa4f2c2095cbc9d7191078ca589b9fbf845'

FullName : X:\01 REPOSITORIES\sgSHIOK2026\uv.lock
Length   : 243377


Algorithm : SHA256
Hash      : 032F0B86CA392342FD18A2A83624CAA4F2C2095CBC9D7191078CA589B9FBF845
Path      : X:\01 REPOSITORIES\sgSHIOK2026\uv.lock

expected_sha256=032f0b86ca392342fd18a2a83624caa4f2c2095cbc9d7191078ca589b9fbf845

$ Get-Item web\package-lock.json | Select-Object FullName,Length | Format-List; Get-FileHash web\package-lock.json -Algorithm SHA256 | Format-List; 'expected_sha256=04765d87615d6d3f835adcc311b0489665e82113744d1cf291836ef8ed3aeb4e'

FullName : X:\01 REPOSITORIES\sgSHIOK2026\web\package-lock.json
Length   : 94509


Algorithm : SHA256
Hash      : 04765D87615D6D3F835ADCC311B0489665E82113744D1CF291836EF8ED3AEB4E
Path      : X:\01 REPOSITORIES\sgSHIOK2026\web\package-lock.json

expected_sha256=04765d87615d6d3f835adcc311b0489665e82113744d1cf291836ef8ed3aeb4e

$ Get-Item raw\manifest.json | Select-Object FullName,Length | Format-List; Get-FileHash raw\manifest.json -Algorithm SHA256 | Format-List; 'expected_sha256=9413e328228e9b79f577665783303509bb1a60cf414cb8d886d20580cf4190be'

FullName : X:\01 REPOSITORIES\sgSHIOK2026\raw\manifest.json
Length   : 10955


Algorithm : SHA256
Hash      : 9413E328228E9B79F577665783303509BB1A60CF414CB8D886D20580CF4190BE
Path      : X:\01 REPOSITORIES\sgSHIOK2026\raw\manifest.json

expected_sha256=9413e328228e9b79f577665783303509bb1a60cf414cb8d886d20580cf4190be

$ if (Test-Path processed\network_island.parquet) { Get-Item processed\network_island.parquet | Select-Object FullName,Length | Format-List; Get-FileHash processed\network_island.parquet -Algorithm SHA256 | Format-List } else { 'present=false' }; 'expected_sha256=19f3b55847cd1ad74878cdec580f07f5cc3110d1eb252b5b1ffe4c5c38b4ab65'

FullName : X:\01 REPOSITORIES\sgSHIOK2026\processed\network_island.parquet
Length   : 52240373


Algorithm : SHA256
Hash      : 19F3B55847CD1AD74878CDEC580F07F5CC3110D1EB252B5B1FFE4C5C38B4AB65
Path      : X:\01 REPOSITORIES\sgSHIOK2026\processed\network_island.parquet

expected_sha256=19f3b55847cd1ad74878cdec580f07f5cc3110d1eb252b5b1ffe4c5c38b4ab65

$ Get-Item qa\p8_provenance_repair_20260813\subset_1200_ready.parquet | Select-Object FullName,Length | Format-List; Get-FileHash qa\p8_provenance_repair_20260813\subset_1200_ready.parquet -Algorithm SHA256 | Format-List; 'expected_sha256=8e524720d21acd0ff7f705dac22ff335412f6af615ccaa28f28557351a5d296d'

FullName : X:\01 REPOSITORIES\sgSHIOK2026\qa\p8_provenance_repair_20260813\subset_1200_ready.parquet
Length   : 88944


Algorithm : SHA256
Hash      : 8E524720D21ACD0FF7F705DAC22FF335412F6AF615CCAA28F28557351A5D296D
Path      : X:\01 REPOSITORIES\sgSHIOK2026\qa\p8_provenance_repair_20260813\subset_1200_ready.parquet

expected_sha256=8e524720d21acd0ff7f705dac22ff335412f6af615ccaa28f28557351a5d296d

$ Strand 0 presence inventory
path=processed\network_island.parquet
present=true
type=file
bytes=52240373

path=qa\p8_provenance_repair_20260813\subset_1200_ready.parquet
present=true
type=file
bytes=88944

path=qa\p10_network_provenance_20260813\score
present=true
type=directory
file_count=4
bytes=187313839

path=qa\p10_network_provenance_20260813\exported_bundle
present=true
type=directory
file_count=289
bytes=53908541

path=processed\postal_universe_candidate_full_registered_geocoded_part01_of04.parquet
present=true
type=file
bytes=1641315

path=processed\postal_universe_candidate_full_registered_geocoded_part02_of04.parquet
present=true
type=file
bytes=1602557

path=processed\postal_universe_candidate_full_registered_geocoded_part03_of04.parquet
present=true
type=file
bytes=1590093

path=processed\postal_universe_candidate_full_registered_geocoded_part04_of04.parquet
present=true
type=file
bytes=1557148

$ Get-Content .agents\STATE.md -Raw
# Current State

Date: 2026-08-14

Task: Rebuild local dependencies on `X:\01 REPOSITORIES\sgSHIOK2026` after migration.

Status:
- `uv sync` completed after a long copy/install phase; `.venv` exists and core imports verify.
- `npm --prefix web ci` completed; `web/node_modules` exists and `npm --prefix web ls --depth=0` is clean.
- `.gitignore` now explicitly unignores `.agents/` so shared handoff state can be committed.
- `git status` source changes remain unchanged except expected untracked migration evidence dirs:
  - `qa/p10_network_provenance_20260813/`
  - `qa/p8_provenance_repair_20260813/`

Notes:
- Initial timed-out `uv sync` and `npm ci` left partial dependency trees; reruns were allowed to finish.
- `uv sync` warned that hardlinks failed and fell back to full copies, likely because cache and repo are on different filesystems.
- Do not assume huge historical scratch dirs such as `qa/p6...`, `qa/p7...`, or `qa/p9...` are fully copied unless a future task verifies them.

$ Get-Content .agents\JOURNAL.md -Raw
# Journal

- 2026-08-14: Rebuilt local Python and web dependencies on X; package installs were slow due full-copy/fetch behavior, but final Python imports and `npm ls` verified clean.
- 2026-08-14: Unignored `.agents/` in `.gitignore` so durable shared agent state can be tracked as required by `AGENTS.md`.

$ git check-ignore -v .agents\STATE.md .agents\JOURNAL.md; "check_ignore_exit=$LASTEXITCODE"; git ls-files .agents\STATE.md .agents\JOURNAL.md
check_ignore_exit=1
.agents/JOURNAL.md
.agents/STATE.md

$ uv run python -VV
Python 3.12.10 (tags/v3.12.10:0cc8128, Apr  8 2025, 12:21:36) [MSC v.1943 64 bit (AMD64)]

$ uv run python -c "import shapely, pyproj, geopandas, igraph, h3, duckdb, numpy, pandas; print(shapely.__version__, shapely.geos_version, pyproj.__version__, pyproj.proj_version_str, geopandas.__version__, igraph.__version__, h3.__version__, duckdb.__version__, numpy.__version__, pandas.__version__)"
error: Failed to read metadata from: `X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\hypothesis-6.161.5.dist-info`
  Caused by: failed to open file `X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\hypothesis-6.161.5.dist-info\uv_cache.json`: Insufficient system resources exist to complete the requested service. (os error 1450)

$ uv run python -c "import shapely, pyproj, geopandas, igraph, h3, duckdb, numpy, pandas; print(shapely.__version__, shapely.geos_version, pyproj.__version__, pyproj.proj_version_str, geopandas.__version__, igraph.__version__, h3.__version__, duckdb.__version__, numpy.__version__, pandas.__version__)"
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\geopandas\__init__.py", line 3, in <module>
    from geopandas.geoseries import GeoSeries
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\geopandas\geoseries.py", line 8, in <module>
    import pandas as pd
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\__init__.py", line 58, in <module>
    from pandas.core.api import (
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\core\api.py", line 27, in <module>
    from pandas.core.arrays import Categorical
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\core\arrays\__init__.py", line 19, in <module>
    from pandas.core.arrays.sparse import SparseArray
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\core\arrays\sparse\__init__.py", line 1, in <module>
    from pandas.core.arrays.sparse.accessor import (
ModuleNotFoundError: No module named 'pandas.core.arrays.sparse.accessor'

$ .\.venv\Scripts\python.exe -c "import shapely, pyproj, geopandas, igraph, h3, duckdb, numpy, pandas; print(shapely.__version__, shapely.geos_version, pyproj.__version__, pyproj.proj_version_str, geopandas.__version__, igraph.__version__, h3.__version__, duckdb.__version__, numpy.__version__, pandas.__version__)"
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\geopandas\__init__.py", line 3, in <module>
    from geopandas.geoseries import GeoSeries
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\geopandas\geoseries.py", line 8, in <module>
    import pandas as pd
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\__init__.py", line 34, in <module>
    from pandas.compat import (
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\compat\__init__.py", line 28, in <module>
    from pandas.compat.pyarrow import (
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pandas\compat\pyarrow.py", line 12, in <module>
    import pyarrow as pa
  File "X:\01 REPOSITORIES\sgSHIOK2026\.venv\Lib\site-packages\pyarrow\__init__.py", line 296, in <module>
    import pyarrow.types as types
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1322, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 1262, in _find_spec
  File "<frozen importlib._bootstrap_external>", line 1532, in find_spec
  File "<frozen importlib._bootstrap_external>", line 1506, in _get_spec
  File "<frozen importlib._bootstrap_external>", line 1609, in find_spec
  File "<frozen importlib._bootstrap_external>", line 1652, in _fill_cache
OSError: [WinError 1450] Insufficient system resources exist to complete the requested service: 'X:\\01 REPOSITORIES\\sgSHIOK2026\\.venv\\Lib\\site-packages\\pyarrow'

$ FINDINGS
FINDINGS
- E14 confirmed by hostname `Prawn-E14` and hardware identity `Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz`, 4 cores, 8 logical processors, TotalPhysicalMemory 16942411776.
- Command execution must explicitly `Set-Location -LiteralPath 'X:\01 REPOSITORIES\sgSHIOK2026'`; one plain `pwd` invocation returned `C:\Program Files\PowerShell\7`, so the handback uses explicit location commands only.
- HEAD is `cf3879c7d8c7113bd39acabd54542365c1e66e0a`, not the Step 0 base `8014acf`; `cf3879c` is the pushed `.agents` tracking commit made before the P11 strand instructions were complete.
- `uv.lock`, `web/package-lock.json`, `raw/manifest.json`, `processed/network_island.parquet`, and `qa/p8_provenance_repair_20260813/subset_1200_ready.parquet` match the Step 0 byte sizes and sha256 values shown above.
- Strand 0 presence inventory is complete for the named local paths: P10 `score` has 4 files and 187313839 bytes; P10 `exported_bundle` has 289 files and 53908541 bytes; all four 124032 split files are present under `processed\` with Step 0 byte sizes.
- The exact E14 library identity command from `qa/verification/P11-t14-artifacts.json` does not currently reproduce: one run failed with `os error 1450` reading `hypothesis-6.161.5.dist-info\uv_cache.json`; a later run failed importing pandas with `ModuleNotFoundError: No module named 'pandas.core.arrays.sparse.accessor'`.
- Direct `.venv\Scripts\python.exe` is not a valid substitute for the exact command, and it also fails importing the same stack with `OSError: [WinError 1450]` under `pyarrow`.
- Because GEOS and PROJ identity cannot be produced from the exact E14 command, Strand 2 has not been run.
- I did not scan, enumerate, index, create, modify, move, rename, prune, compact, or delete anything outside `X:\01 REPOSITORIES\sgSHIOK2026`.
- I did not search the filesystem for other clones, backups, or copies of this repo.

$ DISAGREEMENTS
DISAGREEMENTS
None
