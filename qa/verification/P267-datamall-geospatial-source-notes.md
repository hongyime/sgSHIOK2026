# P267 DataMall Geospatial Source Notes

## Working Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence Path Ignore Check

```text
EXIT=1
```

## Change

`pipeline/config/sources.yaml` DataMall geospatial listing notes now distinguish frozen-v1 static/redacted URLs from current discovery, including authenticated `GeospatialWholeIsland` fallback for covered linkway and overhead bridge/underpass. The notes also state that refreshes must be new numbered input versions, not in-place repairs.

## Focused Tests

Command:

```text
uv run pytest tests/test_fetch.py -q
```

Output:

```text
....................                                                     [100%]
20 passed in 3.25s
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
EXIT=0
```

## FINDINGS

1. `pipeline/config/sources.yaml` still described covered linkway and overhead bridge/underpass as unauthenticated public downloads after P264 proved current discovery falls back to authenticated `GeospatialWholeIsland`.
2. The source notes now align with the versioned-input policy: current discovery drift is release-risk evidence, not a reason to mutate frozen v1.

## DISAGREEMENTS

1. None.
