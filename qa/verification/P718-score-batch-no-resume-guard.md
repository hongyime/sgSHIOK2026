# P718 Score Batch No-Resume Output Guard

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Zero pipeline-cost change. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change was performed.

## Change

`pipeline.score_batch.build_score_batch()` now refuses non-dry-run output paths that are files, and refuses `resume=False` with a non-empty output directory before loading postal-universe inputs, scoring context, or records.

Normal resume behavior is preserved: existing output directories are still allowed when `resume=True`.

## Command Output

### Targeted Tests

```text
...........                                                              [100%]
11 passed in 10.71s
```

### Python Collect-Only

```text
506 tests collected in 8.40s
```

### Repo Integrity

```text
repo_integrity=ok
exit=0
```

### Diff Check

```text
exit=0
```

### Protected Diff Guard

```text
exit=0
```

## FINDINGS

1. `build_score_batch(resume=False)` could point at a non-empty batch directory and rewrite chunk paths instead of requiring a fresh destination.
2. The new preflight fails before input loading or scoring context creation, so a stale `--output-dir` mistake costs zero scoring time and does not mutate existing batch evidence.

## DISAGREEMENTS

1. None.
