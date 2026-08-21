# P526 Geocode universe versioned output guard

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
e8fed5ae4a1ec6196d0d478f9305d2a1ecadc306
e8fed5ae4a1ec6196d0d478f9305d2a1ecadc306	refs/heads/main
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_geocode_universe.py tests/test_run.py -q
```

Output:

```text
.....................                                                    [100%]
21 passed in 3.00s
```

## Help probe

Command:

```text
uv run python -m pipeline.geocode_universe --help | Select-String -Pattern "numeric-version|frozen v1|unversioned|existing outputs"
```

Output:

```text

Non-dry runs require fresh numeric-version output artifacts; never repair
frozen v1 in place.
  --output OUTPUT       Fresh numeric-version parquet path; non-dry runs
                        refuse unversioned or existing outputs.
  --summary SUMMARY     Fresh numeric-version summary JSON path; defaults to

```

## FINDINGS

1. `geocode_universe_gaps` required `--confirm-bounded-geocode`, but a confirmed non-dry run could still use the unversioned default `_geocoded` output name.
2. The same code path could overwrite an existing output/summary path before this guard.
3. Non-dry geocode fills now require fresh numeric-version output artifacts before reading queued rows, opening the cache, or making OneMap requests.

## DISAGREEMENTS

1. None.
