# P72 Night-Lighting Overlay Release Guard Evidence

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Current Head At Start

```text
749926d fix: load env for batch-plan credential readiness
3a8ef33 fix: report API credential readiness
1a358f4 docs: align MCST proxy terminology
c66a6df fix: clarify MCST proxy wording in universe caveat
4018699 fix: expose postal universe source policy in batch plan
233fd4e fix: record postal universe source policy in readiness
edfed79 docs: explain postal universe source policy
b6b8ca8 docs: record OneMap enumeration feasibility
749926db8150fa9f7f8b63923b9cd527372650d8
749926db8150fa9f7f8b63923b9cd527372650d8	refs/heads/main
```

## Local Lamp Overlay Artifact Status

Command:

```text
uv run python -c "from scripts.production_readiness import lamp_overlay_artifact_status; import json; print(json.dumps(lamp_overlay_artifact_status(), indent=2, sort_keys=True))"
```

Output:

```text
{
  "artifact_dir": "C:\\sgSHIOK2026\\web\\public\\data\\lamp_posts_v1",
  "h3_resolution": 8,
  "local_tile_bytes": 3026077,
  "manifest_path": "C:\\sgSHIOK2026\\web\\public\\data\\lamp_posts_v1\\manifest.json",
  "missing_tile_count": 0,
  "missing_tiles_sample": [],
  "ok": true,
  "point_count": 126144,
  "size_mismatch_count": 0,
  "size_mismatches_sample": [],
  "source_bytes": 41907845,
  "source_sha256": "2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29",
  "state": "passed",
  "tile_bytes": 3026077,
  "tile_count": 700,
  "tile_index_count": 700,
  "warning": null
}
```

## Focused Tests

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

Output:

```text
...................                                                      [100%]
19 passed in 73.31s (0:01:13)
```

## Protected Artifact Ignore Status

Command:

```text
git ls-files "web/public/data/lamp_posts_v1/*"; git check-ignore -v "web/public/data/lamp_posts_v1/manifest.json"; Write-Output "ignore_exit=$LASTEXITCODE"
```

Output:

```text
.gitignore:30:web/public/data/	web/public/data/lamp_posts_v1/manifest.json
ignore_exit=0
```

## Final Verification

Command:

```text
git check-ignore -v qa/verification/P72-lamp-overlay-release-guard.md; Write-Output "ignore_exit=$LASTEXITCODE"
```

Output:

```text
ignore_exit=1
```

Command:

```text
git diff --check; Write-Output "diff_check_exit=$LASTEXITCODE"; git diff -- pipeline/config/weights.yaml; Write-Output "weights_exit=$LASTEXITCODE"
```

Output:

```text
diff_check_exit=0
weights_exit=0
```

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## FINDINGS

1. The browser already exposes the night-lighting layer through `/data/lamp_posts_v1/`, but production readiness did not previously prove that the gitignored local deploy artifact exists and is internally consistent.
2. The current local lamp overlay artifact is release-ready by static checks: 700 manifest-indexed tiles, 126,144 lamp points, 3,026,077 tile bytes, 0 missing referenced tiles, and 0 tile size mismatches.
3. `web/public/data/lamp_posts_v1/manifest.json` remains gitignored under `web/public/data/`; the guard reads it for release readiness but this change does not modify public data.

## DISAGREEMENTS

1. None.
