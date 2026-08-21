# P509 fetch help positive freshness wording

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

`pipeline.fetch check --help` now uses positive wording for named freshness summaries: grouped action summaries include source names.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py -q
.....................                                                    [100%]
21 passed in 9.30s
```

```text
PS C:\sgSHIOK2026> uv run python -m pipeline.fetch check --help
usage: fetch.py [-h] [--freshness-only] [--geospatial-discovery-only]
                [--source SOURCE]
                {check,ingest}

Fetch/check upstream SHIOK datasets.

positional arguments:
  {check,ingest}

options:
  -h, --help            show this help message and exit
  --freshness-only      For check: read raw/manifest.json and report source
                        freshness without probing upstream URLs or writing the
                        manifest; grouped action summaries include source
                        names.
  --geospatial-discovery-only
                        For check: resolve DataMall geospatial listing URLs
                        without downloading payloads or writing the manifest.
  --source SOURCE       Restrict to one source key. Can be passed multiple
                        times.
```

## FINDINGS

1. The previous `pipeline.fetch` help was correct but awkward: it described the report as not omitting source names. The rest of the project uses the clearer positive contract that grouped action summaries include source names.
2. This is lower-level CLI help/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
