# P246 shelter map user-agent identifiers

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P246 updates maintained pipeline HTTP user-agent identifiers from the retired
SHIOK Index frame to S.H.I.O.K. Shelter Map.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, source fetch, upstream API call, or locked-weight change
was run.

## Focused pytest

```text
uv run pytest C:\sgSHIOK2026\tests\test_fetch.py::test_maintained_pipeline_user_agents_use_shelter_map_frame -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 1 item

tests\test_fetch.py .                                                    [100%]

============================== 1 passed in 3.87s ==============================
```

## Retired user-agent grep

```text
rg -n "SHIOK-Index|Singapore Walk-to-Transit Index" C:\sgSHIOK2026\pipeline --glob '!config/weights.yaml'; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Evidence tracking check

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P246-shelter-map-user-agent.md; Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Repository integrity

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Locked weights diff

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. Maintained pipeline callers still identified upstream requests as `SHIOK-Index` / `Singapore Walk-to-Transit Index` even though the product and repository framing has moved to S.H.I.O.K. Shelter Map.
2. Pipeline fetch, bus, bounded geocode, postal-universe, OneMap probe, OneMap validation, and data.gov.sg resolver user-agent identifiers now use `sgSHIOK-Shelter-Map`.
3. `pipeline/config/weights.yaml` still contains the locked historical header and was not read-modify-written or reformatted.

## DISAGREEMENTS

1. None.
