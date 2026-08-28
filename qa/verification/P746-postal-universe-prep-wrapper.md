# P746 Postal Universe Prep Wrapper

## Startup

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

`scripts/prepare-postal-universe.ps1` was stale after the runner guards:

- `run.py postal-universe` requires `--confirm-postal-universe`.
- `run.py geocode-universe` requires non-dry bounded fills to use a versioned cache such as `raw/geocode_cache_v2.db`.

The wrapper now passes `--confirm-postal-universe` and derives `raw\geocode_cache_${Version}.db` for `--cache-db`.

No universe build, geocoding, OneMap call, raw mutation, processed mutation, scoring, export, deployment, public-data write, protected QA evidence mutation, or locked-weight change was performed.

## Verification

```text
..                                                                       [100%]
2 passed in 2.05s
```

```text
569 tests collected in 17.42s
```

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## Findings

1. `scripts/prepare-postal-universe.ps1` would fail under the current runner because it omitted `--confirm-postal-universe`.
2. The same wrapper would then fail the bounded geocode cache guard because it did not pass a numeric-version cache path.
3. A source-text test now pins both confirmations and the version-derived cache path.

## Disagreements

1. None.
