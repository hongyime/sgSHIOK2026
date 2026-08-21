# P520 P125 help cross-check label

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
b536ebd0df671ed0f235cecb1d3946e8e0f1957c
b536ebd0df671ed0f235cecb1d3946e8e0f1957c	refs/heads/main
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
15 passed in 2.60s
```

## Help and status probes

Command:

```text
uv run python run.py --help | Select-String -Pattern "p125-osm-status|20 Aug 2026|addr:postcode|address registry"
uv run python run.py p125-osm-status | Select-String -Pattern "measurement|source_role|registry_policy|will_call_apis|will_write_files"
```

Output:

```text
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  p125-osm-status reads cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and frozen v1 universe only, reporting OSM as geometry evidence rather than the address 
registry; it calls no APIs and writes no files.
    "registry_policy": "not the address registry",
    "source_role": "geometry evidence and coverage cross-check",
  "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check",
  "will_call_apis": false,
  "will_write_files": false
```

## FINDINGS

1. `p125-osm-status` help described generic cached P125 Overpass output even though the cached report is specifically the 20 Aug 2026 Overpass `addr:postcode` coverage cross-check.
2. Runner help now carries the dated cross-check label and the OSM-not-address-registry boundary at the command entry point.

## DISAGREEMENTS

1. None.
