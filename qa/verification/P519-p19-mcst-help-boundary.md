# P519 P19 MCST help boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
67ba54b1b2451931057d58d040209210a47c99af
67ba54b1b2451931057d58d040209210a47c99af	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_run.py tests/test_readme.py -q
```

Output:

```text
...................                                                      [100%]
19 passed in 4.71s
```

## Help and status probes

Command:

```text
uv run python run.py --help | Select-String -Pattern "p19-gap-status|p19-mcst-locations|public-source sample|unvalidated"
uv run python run.py p19-mcst-locations | Select-String -Pattern "will_call_apis|will_write_files|unlocated_developments|CANAAN|MYRA|mode"
```

Output:

```text
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  p19-gap-status reads cached P19 16 Aug 2026 public-source sample status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p19-mcst-locations reads existing P379 status for unvalidated P19 MCST proxy rows only; it calls no APIs and writes no files.
    "CANAAN": {
  "mode": "p379_cache_status_only",
  "unlocated_developments": [
    "CANAAN",
    "MYRA"
  "will_call_apis": false,
  "will_write_files": false
```

## FINDINGS

1. `p19-mcst-locations` help described a generic MCST proxy probe, while settled product copy and policy classify those rows as unvalidated source-quality proxy evidence.
2. Runner help and README now keep the unvalidated MCST boundary visible where the P19 cache-status commands are introduced.

## DISAGREEMENTS

1. None.
