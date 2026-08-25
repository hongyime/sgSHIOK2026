# P571 Ingest Refreshes

## Scope

Task 5 (P571) was scoped to the eight keys listed in `qa\p570_refresh_plan.md`, each assigned a new `raw\<key>\v2` directory:

- `traffic_signals`
- `planning_area_boundary`
- `nparks_nature_ways`
- `nparks_tracks`
- `nparks_heritage_trees`
- `nparks_heritage_road_green_buffers`
- `covered_linkway`
- `overhead_bridge_underpass`

`leaf_area_index` remained watch-only and was not ingested.

## Evidence

Task start: 2026-08-25 Asia/Singapore.

Module contract command:

```powershell
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --help
```

Relevant usage lines:

```text
usage: fetch.py [-h] [--freshness-only] [--geospatial-discovery-only]
                [--source SOURCE]
                {check,ingest}

positional arguments:
  {check,ingest}

options:
  --source SOURCE       Restrict to one source key. Can be passed multiple
                        times.
```

Dispatcher notes checked:

```powershell
rg -n "ingest|fetch ingest|def .*ingest|subparser|argparse" "C:\sgSHIOK2026\run.py" "C:\sgSHIOK2026\pipeline"
```

Relevant dispatcher line from `run.py`:

```text
if name == "ingest":
    return run_module("pipeline.fetch", [name])
```

Fetch implementation checked:

```powershell
$lines = Get-Content -LiteralPath 'C:\sgSHIOK2026\pipeline\fetch.py'; $lines[1010..1395]
```

Relevant implementation behavior:

```text
target_dir = RAW_DIR / sha256
target_dir.mkdir(parents=True, exist_ok=True)
target_path = target_dir / filename
...
manifest_sources[key] = new_entry
```

Planned directory existence check:

```powershell
$dirs = @('C:\sgSHIOK2026\raw\traffic_signals\v2','C:\sgSHIOK2026\raw\planning_area_boundary\v2','C:\sgSHIOK2026\raw\nparks_nature_ways\v2','C:\sgSHIOK2026\raw\nparks_tracks\v2','C:\sgSHIOK2026\raw\nparks_heritage_trees\v2','C:\sgSHIOK2026\raw\nparks_heritage_road_green_buffers\v2','C:\sgSHIOK2026\raw\covered_linkway\v2','C:\sgSHIOK2026\raw\overhead_bridge_underpass\v2'); foreach ($d in $dirs) { if (Test-Path -LiteralPath $d) { Get-ChildItem -LiteralPath $d -Force | Measure-Object | ForEach-Object { "$d exists count=$($_.Count)" } } else { "$d missing" } }
```

Result: all eight planned `raw\<key>\v2` directories were missing before any ingest attempt.

Per-source ingest commands were not launched because the documented contract has no flag to target the assigned `raw\<key>\v2` directories. Running the current command form would write under `raw\<sha256>` instead and could rewrite an existing content-addressed directory if upstream returns identical bytes with a 200 response.

Per-source results:

| Key | Intended command | Exit code | Hash / bytes | Log path | Result |
| --- | --- | --- | --- | --- | --- |
| `traffic_signals` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source traffic_signals` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\traffic_signals\v2` |
| `planning_area_boundary` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source planning_area_boundary` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\planning_area_boundary\v2` |
| `nparks_nature_ways` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_nature_ways` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\nparks_nature_ways\v2` |
| `nparks_tracks` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_tracks` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\nparks_tracks\v2` |
| `nparks_heritage_trees` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_heritage_trees` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\nparks_heritage_trees\v2` |
| `nparks_heritage_road_green_buffers` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_heritage_road_green_buffers` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\nparks_heritage_road_green_buffers\v2` |
| `covered_linkway` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source covered_linkway` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\covered_linkway\v2` |
| `overhead_bridge_underpass` | `$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source overhead_bridge_underpass` | not run | not available | not created | BLOCKED: no output-dir contract for `raw\overhead_bridge_underpass\v2` |

## Findings

The task is blocked by an ingest-contract mismatch. The approved P570 plan requires fresh numbered output directories under `raw\<key>\v2`, but `pipeline.fetch ingest` only supports `--source` filtering and writes payloads under content-addressed `raw\<sha256>` directories. The module also does not write a per-directory hash sidecar for `raw\<key>\v2`.

No upstream downloads were started. No credentials were checked. No payload directories were created. No manifest writes were performed.

## Disagreements

Minimal disagreement: the current checked-in ingest contract does not implement the versioned output target required by P571.

## P571 EXECUTION VIA NATIVE CONTRACT

Correction note: literal `raw\key\v2` directory assignments from the P570 artifact are superseded by the module-native content-addressed contract per orchestrator ruling. The executed contract was `uv run python -m pipeline.fetch ingest --source KEY`; payload storage is `raw\SHA256`, and `raw\manifest.json` owns the source pointers.

Task start: `2026-08-25T20:28:17.2428758+08:00`.

Commands run verbatim:

```powershell
Set-Location -LiteralPath 'C:\sgSHIOK2026'
$env:PYTHONUTF8='1'
git rev-parse HEAD
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\sgSHIOK2026\raw\manifest.json'
Get-ChildItem -LiteralPath 'C:\sgSHIOK2026\raw' -Directory | Measure-Object
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source traffic_signals
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source planning_area_boundary
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_nature_ways
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_tracks
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_heritage_trees
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source nparks_heritage_road_green_buffers
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source covered_linkway
$env:PYTHONUTF8='1'; uv run python -m pipeline.fetch ingest --source overhead_bridge_underpass
Get-Content -LiteralPath 'C:\sgSHIOK2026\raw\manifest.json' -Raw | ConvertFrom-Json
git status --porcelain=v1
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data
```

Pre/post snapshot:

| Field | Pre | Post | Delta |
| --- | --- | --- | --- |
| HEAD | `c10a9582aa19ea877e6fc931e4d008126f3543be` | pending commit | n/a |
| raw manifest sha256 | `9413e328228e9b79f577665783303509bb1a60cf414cb8d886d20580cf4190be` | `ad90df61621bea3d4a3cb207c012b988d2e9338e116ce521b00307198919ae5a` | changed |
| raw directory count | 29 | 29 | 0 |

Per-source results:

| Key | Exit | New raw dirs | Bytes / files | Hash / manifest pointer | Log | Result |
| --- | ---: | --- | --- | --- | --- | --- |
| `traffic_signals` | 0 | none | 1337159 bytes in manifest | `manifest sha256 942ff2506603f431f0782a3acdc70fec75d4b15c73b54f1a983c804c60d818af` | `logs\P571-ingest-traffic_signals-20260825-202855.log` | 304 unchanged; no new directory |
| `planning_area_boundary` | 0 | none | 2092229 bytes in manifest | `manifest sha256 f23856251b467089f788d0fff72ef5a38e753f21aa69b4352401d7ed50d380cc` | `logs\P571-ingest-planning_area_boundary-20260825-202958.log` | 304 unchanged; no new directory |
| `nparks_nature_ways` | 0 | none | 208278 bytes in manifest | `manifest sha256 9b4e0e1e9d868cc9bff468e1b3028214707f2a41661bc8f279c61e88094f2d11` | `logs\P571-ingest-nparks_nature_ways-20260825-203028.log` | 304 unchanged; no new directory |
| `nparks_tracks` | 0 | none | 25252264 bytes in manifest | `manifest sha256 2df9d9170d716ceefc2e82aa8889a21a27a3a086996bf330a6ab6b21cb1f0627` | `logs\P571-ingest-nparks_tracks-20260825-203054.log` | 304 unchanged; no new directory |
| `nparks_heritage_trees` | 0 | none | 149987 bytes in manifest | `manifest sha256 7f9a1b6413735824704993994b5491c30dcb9d1b746e80a5c17a6f59629d835f` | `logs\P571-ingest-nparks_heritage_trees-20260825-203215.log` | 304 unchanged; no new directory |
| `nparks_heritage_road_green_buffers` | 0 | none | 254367 bytes in manifest | `manifest sha256 87238ae673f898a30b1fcbf5b5527625b4c49c7aa1769567adb92b93b9b685b5` | `logs\P571-ingest-nparks_heritage_road_green_buffers-20260825-203249.log` | 304 unchanged; no new directory |
| `covered_linkway` | 0 | none | 1096785 bytes in manifest | `manifest sha256 d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee` | `logs\P571-ingest-covered_linkway-20260825-203313.log` | downloaded; content hash matched existing directory |
| `overhead_bridge_underpass` | 0 | none | 478973 bytes in manifest | `manifest sha256 bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444` | `logs\P571-ingest-overhead_bridge_underpass-20260825-203416.log` | downloaded; content hash matched existing directory |

Manifest JSON verification: all eight target keys are present. Six sources retained existing content-addressed SHA pointers after 304 responses. `covered_linkway` and `overhead_bridge_underpass` updated manifest metadata and validation while still pointing at existing content-addressed directories because the downloaded bytes hashed to the same SHA256 values. No source pointed at a newly created directory because no new content-addressed directory was created.

Tracked file verification:

- Tracked raw changes: `raw/manifest.json`.
- Protected-path guard for `pipeline/config/weights.yaml`, `checksums.json`, and `web/public/data`: `empty`.
- `leaf_area_index` remained watch-only and was not ingested; manifest pointer remains `26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899`.

Old raw directory spot-checks:

| Directory | Newest mtime observed before task | Comparison |
| --- | --- | --- |
| `validation` | `2026-08-13T22:27:51.9100000+08:00` | predates task start |
| `tmp` | `2026-08-12T09:45:26.0000000+08:00` | predates task start |
| `9d249959b4010d00a7d91f8161f22188bbb0203a27185f91f46b41595f4884f0` | `2026-08-02T05:49:22.0000000+08:00` | predates task start |

OLD_DIRS_TOUCHED: none

Payload file mtimes after task start inside existing content-addressed directories: `bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444\overhead_bridge_underpass.zip 2026-08-25T20:35:08.6000213+08:00 bytes=478973`, `d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee\covered_linkway.zip 2026-08-25T20:34:13.3055724+08:00 bytes=1096785`

