# P73 Night-Lighting Source Disclosure Evidence

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Current Head At Start

```text
21fc772 fix: guard night-lighting overlay readiness
749926d fix: load env for batch-plan credential readiness
3a8ef33 fix: report API credential readiness
1a358f4 docs: align MCST proxy terminology
c66a6df fix: clarify MCST proxy wording in universe caveat
4018699 fix: expose postal universe source policy in batch plan
21fc772e1f2d8a02458b758b85cb0cc6467d480c
21fc772e1f2d8a02458b758b85cb0cc6467d480c	refs/heads/main
```

## Lamp Source Manifest

Command:

```text
uv run python -c "import json; m=json.load(open(r'C:\sgSHIOK2026\raw\manifest.json', encoding='utf-8')); print(json.dumps(m['sources']['lamp_posts'], indent=2, sort_keys=True))"
```

Output:

```text
{
  "bytes": 41907845,
  "etag": "\"78016b28d968233e6ee851cc2b4c55e5-4\"",
  "fetched_at": "2026-07-26T07:50:33.401278+00:00",
  "last_modified": "Tue, 07 Jul 2026 02:06:48 GMT",
  "sha256": "2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29",
  "source_name": "Lamp Posts",
  "url_as_discovered": "https://s3.ap-southeast-1.amazonaws.com/blobs.data.gov.sg/d_ca109de3e83efdd9a10bc5f3dda70a98.geojson"
}
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

## Focused Web Tests

Command:

```text
npm --prefix web test -- route-evidence-map-interaction score-card-copy
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  19 passed (19)
   Start at  17:56:09
   Duration  2.88s (transform 1.90s, setup 0ms, import 358ms, tests 1.96s, environment 1ms)
```

## Focused Readiness Tests

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

Output:

```text
...................                                                      [100%]
19 passed in 63.55s (0:01:03)
```

## Final Verification

Command:

```text
git check-ignore -v qa/verification/P73-night-lighting-source-disclosure.md; Write-Output "ignore_exit=$LASTEXITCODE"
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

1. The night-lighting note previously said only that the layer was map evidence outside the locked score; it did not expose the source date or scale of the LTA lamp-post evidence.
2. P72's first committed local-artifact test depended on `web/public/data/lamp_posts_v1/`, which is gitignored and absent from a fresh clone. P73 changes the committed test to use a temporary fixture while leaving local artifact validation in evidence/readiness output.
3. The current local lamp overlay artifact still validates with 700 tiles, 126,144 points, 0 missing tiles, and 0 tile size mismatches.

## DISAGREEMENTS

1. None.
