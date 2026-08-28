# P736 bounded geocode cache versioning

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit_code=1
```

## Focused tests

```text
...............................                                          [100%]
31 passed in 19.14s
```

## Help text guard

```text
                           [--confirm-bounded-geocode]
frozen v1 in place. The mutable geocode cache must also be explicitly
                        refuse unversioned or existing outputs.
                        example raw/geocode_cache_v2.db.
  --confirm-bounded-geocode
```

## Pytest collection count

```text
533 tests collected in 82.86s (0:01:22)
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## Diff whitespace guard

```text
exit_code=0
```

## Protected-path diff guard

```text
exit_code=0
```

## Head and remote

```text
9d976d24f0c76ff68fee25547a00a760997d8a66
9d976d24f0c76ff68fee25547a00a760997d8a66	refs/heads/main
```

## Findings

1. A confirmed non-dry bounded geocode fill could previously use the default unversioned `raw/geocode_cache.db`, creating a mutable cache side channel even though the parquet and summary outputs were already required to be new numeric-version artifacts.
2. The guard now fails before reading queued rows, opening the cache, or calling OneMap when the cache path lacks a numeric version suffix such as `_v2`.
3. `run.py` now names `geocode-universe` in the gated pipeline task list because it can call OneMap and write a cache, parquet, and summary.

## Disagreements

1. None.
