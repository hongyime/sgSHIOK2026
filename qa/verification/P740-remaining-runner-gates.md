# P740 remaining runner confirmation gates

## Root and host

```text
pwd=C:\sgSHIOK2026
host=PRAWN-E14
```

## Focused tests

```text
............................................                             [100%]
44 passed in 2.16s
```

## Findings

1. P739's intended publish gate was bypassed by an earlier `if name == "publish"` branch in `run.py`.
2. `run.py bus-arrivals` called DataMall and appended local snapshot output with only module-level output checks.
3. `run.py bus-connector-diagnostics` and `run.py candidate-audit` launched report writers before checking the confirmation flags their stubs already documented.
4. The runner now refuses those tasks before subprocess launch unless their confirmations are present, while preserving read-only and dry-run report entrypoints.

## Disagreements

1. None.
