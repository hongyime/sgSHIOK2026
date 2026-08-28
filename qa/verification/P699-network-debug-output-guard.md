# P699 network debug output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing default output

```text
True
.gitignore:10:qa/*_debug.geojson	qa/island_debug.geojson
exit=0
```

## CLI no-argument guard

```text
{
  "errors": [
    "network debug rebuild requires explicit --output"
  ]
}
exit=2
```

## Focused tests

```text
....                                                                     [100%]
4 passed in 3.17s
```

## Test collection

```text
469 tests collected in 38.45s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. `scripts/rebuild_network_debug.py` defaulted to `qa/island_debug.geojson`, which exists locally as a large ignored QA artifact. A no-argument run now exits with an explicit output error before reading the QA report.
2. Explicit output paths now reuse the shared non-overwriting report writer, so accidental replacement of a chosen debug output is refused.

## DISAGREEMENTS

1. None.
