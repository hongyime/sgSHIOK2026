# P717 score output guard

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, OneMap probe, input mutation, public-data write, protected payload write, or deployment.

## Change

`pipeline.scoring_integration.main()` now accepts an injected `argv` for tests and refuses an existing `--output` path before it can enter `score_postals()`.

This does not change the default score command behavior or allow full-batch scoring; it only prevents an explicit output path from being overwritten after scoring work completes.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
..................................................................       [100%]
66 passed in 8.60s
```

```text
504 tests collected in 10.59s
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

1. The direct scoring CLI could overwrite an explicit JSON output file after scoring records.
2. The new preflight aborts before `score_postals()` runs, so an output-path mistake costs no scoring time and mutates no report.

## DISAGREEMENTS

1. None.
