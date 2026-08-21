# P515 freshness help refresh boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
6e1ff0600933ec5e0c979a2454c634d9e5f429f9
6e1ff0600933ec5e0c979a2454c634d9e5f429f9	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_run.py tests/test_fetch.py -q
```

Output:

```text
.....................................                                    [100%]
37 passed in 6.67s
```

## Help probes

Command:

```text
uv run python run.py --help | Select-String -Pattern "freshness-only|versioned refresh"
uv run python -m pipeline.fetch check --help | Select-String -Pattern "freshness-only|versioned refresh|source names"
```

Output:

```text
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a 
versioned refresh.
usage: fetch.py [-h] [--freshness-only] [--geospatial-discovery-only]
  --freshness-only      For check: read raw/manifest.json and report source
                        names and stale sources require a versioned refresh.
```

## FINDINGS

1. `run.py --help` and `pipeline.fetch check --help` still described named freshness summaries without saying stale sources require a versioned refresh.
2. The help text now exposes the same stale-source boundary as CLI output, readiness, README, CLAUDE, and browser copy.

## DISAGREEMENTS

1. None.
