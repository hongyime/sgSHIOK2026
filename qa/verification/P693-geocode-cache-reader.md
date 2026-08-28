# P693 Geocode Cache Reader

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Observation

`pipeline/query_db.py` opened `raw/geocode_cache.db` with a cwd-relative path. That could create an
empty SQLite database outside the repository root if invoked from the wrong directory.

## Real Read-only Probe

```text
uv run python -m pipeline.query_db; Write-Output "exit=$LASTEXITCODE"
Postal: 276342 -> Lat: 1.31079354648242, Lon: 103.79946085737
Postal: 266309 -> Lat: 1.32267012216685, Lon: 103.810735643164
Postal: 269434 -> Lat: 1.32245569469143, Lon: 103.809103772304
exit=0
```

## Remaining Relative-cache Scan

```text
rg -n "sqlite3\.connect\(\s*[\"']raw/|sqlite3\.connect\(\s*[\"']raw\\|raw/geocode_cache\.db" C:\sgSHIOK2026\pipeline C:\sgSHIOK2026\scripts C:\sgSHIOK2026\tests C:\sgSHIOK2026\run.py
exit=1
```

## Verification

```text
uv run pytest tests/test_query_db.py tests/test_geocode_universe.py -q -p no:cacheprovider
........                                                                 [100%]
8 passed in 10.56s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
461 tests collected in 48.47s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
exit=0
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. `pipeline/query_db.py` was the remaining cwd-relative `raw/geocode_cache.db` SQLite reader.
2. The cache reader now resolves from `PROJECT_ROOT` and opens SQLite with `mode=ro`, so a missing
   path fails instead of creating a new empty database.
3. Python collection moved from 459 to 461 because two focused query-db tests were added.

## DISAGREEMENTS

1. None.
