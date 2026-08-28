# P739 runner-level writer gates

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Focused tests

```text
......................................                                   [100%]
38 passed in 3.09s
```

## Findings

1. `run.py network` and `run.py score` previously launched their modules without confirmation and relied on module-level checks to refuse unsafe defaults.
2. `run.py export`, `run.py export-transit`, `run.py refresh-provenance`, `run.py onemap-probe`, `run.py geocode-universe`, and `run.py publish` had the same front-door issue.
3. Runner-only flag stripping had a bug: an intentionally empty forwarded list fell back to the original `extra` list. That would have forwarded `--confirm-publish` to `pipeline.publish`.
4. The runner now fails closed before subprocess launch for dangerous non-dry writer/network/deploy tasks, while preserving help access and dry-run score-batch/geocode-universe modes.

## Disagreements

1. None.
