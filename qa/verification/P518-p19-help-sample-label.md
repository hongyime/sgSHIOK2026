# P518 P19 help sample label

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
530a30bc75d174a7ba69a8f7635a1f17b494139c
530a30bc75d174a7ba69a8f7635a1f17b494139c	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused test

Command:

```text
uv run pytest tests/test_run.py -q
```

Output:

```text
...............                                                          [100%]
15 passed in 1.32s
```

## Help and status probes

Command:

```text
uv run python run.py --help | Select-String -Pattern "p19-gap-status|public-source sample"
uv run python run.py p19-gap-status | Select-String -Pattern "measurement_label|will_call_apis|will_write_files|summary"
```

Output:

```text
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  p19-gap-status reads cached P19 16 Aug 2026 public-source sample status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
    "summary": {
      "path": "qa\\p19\\universe_gap_measurement_summary.json",
    "measurement_label": "16 Aug 2026 public-source sample",
    "summary": "6 coordinate-backed HDB missing rows confirmed as address-universe gaps; 2 MCST proxy rows remain source-quality warnings"
  "will_call_apis": false,
  "will_write_files": false
```

## FINDINGS

1. `p19-gap-status` help still called the cached P19 result a generic measurement even though the output and settled policy classify it as the 16 Aug 2026 public-source sample.
2. The runner help now preserves the sample boundary and still states that the command calls no APIs and writes no files.

## DISAGREEMENTS

1. None.
