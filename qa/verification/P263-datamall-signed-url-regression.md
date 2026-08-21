# P263 DataMall signed URL regression

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`
Date: 2026-08-21

## Command output

```text
> uv run pytest tests/test_fetch.py -q
...................                                                      [100%]
19 passed in 3.90s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
> git diff -- pipeline/config/weights.yaml
```

```text
> git diff --stat
 tests/test_fetch.py | 13 +++++++++++++
 1 file changed, 13 insertions(+)
```

## FINDINGS

1. `stable_manifest_url()` already strips current `X-Amz-*` presigned S3 query parameters, but P262 showed the current DataMall fallback returns that URL shape and there was no explicit regression test for it.
2. Fetch tests now guard the current DataMall `dmgeospatial` presigned URL shape so future numbered input probes do not accidentally record expiring query credentials in manifests.
3. This is zero pipeline cost. It does not fetch sources, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

## DISAGREEMENTS

1. None.
