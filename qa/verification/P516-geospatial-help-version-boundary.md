# P516 geospatial help version boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
35fb323dc6937843deb4cc350caea2f092c97961
35fb323dc6937843deb4cc350caea2f092c97961	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_run.py tests/test_fetch.py tests/test_agent_docs.py -q
```

Output:

```text
......................................                                   [100%]
38 passed in 12.60s
```

## Help probes

Command:

```text
uv run python run.py --help | Select-String -Pattern "geospatial-discovery-only|new-version inputs"
uv run python -m pipeline.fetch check --help | Select-String -Pattern "geospatial-discovery-only|new-version inputs|DataMall"
```

Output:

```text
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads, writes no manifest, and treats changed discovery URLs as new-version inputs.
usage: fetch.py [-h] [--freshness-only] [--geospatial-discovery-only]
  --geospatial-discovery-only
                        For check: resolve DataMall geospatial listing URLs
                        changed discovery URLs require new-version inputs.
```

## FINDINGS

1. README already said changed DataMall discovery URLs require a new numbered input version, but `run.py --help`, `pipeline.fetch check --help`, and CLAUDE did not.
2. The geospatial discovery command remains metadata-only and zero-manifest-write, while help now states changed URLs are inputs for a new version rather than an in-place repair.

## DISAGREEMENTS

1. None.
