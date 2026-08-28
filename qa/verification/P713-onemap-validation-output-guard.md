# P713 OneMap validation output guard

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, OneMap collection, input mutation, public-data write, or deployment.

## Change

`pipeline.onemap_validation` now requires an explicit fresh `--output` path for `plan`, `plan-targeted`, `evaluate`, and `collect` CLI actions before sample building, sample reading, cache evaluation, or OneMap collection can start.

Progress and route-cache writes are unchanged because they are resumable working files; the guard covers final report/sample outputs that previously defaulted to reusable `qa/` paths and could be overwritten.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
..........................                                              [100%]
27 passed in 41.92s
```

```text
......................                                              [100%]
27 passed in 29.43s
```

```text
496 tests collected in 40.84s
```

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
exit=0
```

## FINDINGS

1. `pipeline.onemap_validation` had default report/sample outputs under `qa/` and used an overwrite-capable JSON writer for final outputs.
2. The `collect` CLI action read the sample and could enter collection setup before discovering output-path mistakes. The new preflight refuses missing or existing `--output` before that point.
3. The fix intentionally does not change route-cache or progress-output behavior, because resumable validation collection needs those files to be updateable.

## DISAGREEMENTS

1. None.
