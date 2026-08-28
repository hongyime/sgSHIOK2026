# P712 bus-arrivals output guard

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, data collection, or deployment.

## Change

`pipeline.bus_arrivals.collect_snapshots()` now refuses an existing output path before any fetch loop starts. The CLI also preflights the explicit `--output` path and returns structured JSON without calling the LTA API when the target file already exists.

The low-level `append_jsonl()` helper remains append-oriented for unit tests and internal reuse, but snapshot collection now requires a fresh output file.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
.......                                                                  [100%]
7 passed in 3.47s
```

```text
494 tests collected in 7.40s
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

1. `bus-arrivals collect` already required explicit `--output`, but it would append to an existing file. That is too easy to confuse with a fresh arrival snapshot and could mutate prior local evidence.
2. The new guard fires before any network fetch, so a mistaken output path costs no LTA request and writes no partial file.

## DISAGREEMENTS

1. None.
