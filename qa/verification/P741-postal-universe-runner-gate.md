# P741 postal-universe runner gate and lamp-overlay command hygiene

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Focused tests

```text
............................................................................. [ 83%]
.........                                                           [100%]
86 passed in 252.47s (0:04:12)
```

## Findings

1. `run.py postal-universe` previously launched `pipeline.postal_universe` without a runner-level confirmation even though it writes parquet/summary artifacts and can fetch missing sources with `--download-missing`.
2. Batch-plan, production-readiness, and README lamp-overlay replacement examples still omitted `--confirm-lamp-overlay`.
3. Those same examples used `run.py lamp-overlay -- --output ...`; with `parse_known_args`, that stray `--` would be forwarded to `pipeline.lamp_overlay`.

## Disagreements

1. None.
