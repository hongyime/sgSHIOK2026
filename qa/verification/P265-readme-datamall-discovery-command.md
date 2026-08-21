# P265 README DataMall Discovery Command

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

README local-data guidance now names the zero-mutation DataMall geospatial discovery command:

```text
uv run python run.py check --geospatial-discovery-only
```

The README states that the command downloads no payloads, writes no manifest, and that a changed discovery URL requires a new numbered input version rather than an in-place repair.

## Tests

Command:

```text
uv run pytest tests/test_readme.py -q
```

Output:

```text
...                                                                      [100%]
3 passed in 0.64s
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

1. The repository had a safe discovery-only command after P264, but README operator guidance still said only to check upstream before approving a new release batch.
2. README now points operators to `uv run python run.py check --geospatial-discovery-only` and records that drift is handled by a new numbered input version, not by mutating frozen v1.

## DISAGREEMENTS

1. None.
