# P21 Lamp Overlay Artifact

## Working Root

```text
root=C:\sgSHIOK2026
hostname=PRAWN-E14
9de78ff67dcb617a9843bef875416e4549c92505
9de78ff67dcb617a9843bef875416e4549c92505	refs/heads/main
```

## Builder Test

```text
....                                                                     [100%]
4 passed in 3.47s
```

## Real Lamp Source Build

Command:

```text
uv run python run.py lamp-overlay --output C:\sgSHIOK2026\qa\p21\lamp_overlay_h3r8_preview --h3-resolution 8
```

Output:

```text
{"h3_resolution": 8, "manifest_bytes": 120620, "manifest_path": "C:\\sgSHIOK2026\\qa\\p21\\lamp_overlay_h3r8_preview\\manifest.json", "ok": true, "output_dir": "C:\\sgSHIOK2026\\qa\\p21\\lamp_overlay_h3r8_preview", "point_count": 126144, "skipped_feature_count": 0, "tile_bytes": 3026077, "tile_count": 700, "total_bytes": 3146697}
exit=0
elapsed_seconds=16.814
artifact_file_count=701
artifact_total_bytes=3146697
```

## Manifest Summary

```text
manifest_schema_version=1
manifest_source_sha256=2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29
manifest_source_bytes=41907845
manifest_point_count=126144
manifest_skipped_feature_count=0
manifest_h3_resolution=8
manifest_tile_count=700
manifest_tile_bytes=3026077
manifest_bbox=[103.61104765780117, 1.2331792797766035, 104.03149334155863, 1.469904903671129]
smallest_tile={"bytes": 61, "cell": "886520c065fffff", "count": 1}
largest_tile={"bytes": 18908, "cell": "886520d86dfffff", "count": 794}
top_5_largest_tiles=[{"bytes": 12943, "cell": "886520d961fffff", "count": 543}, {"bytes": 13690, "cell": "886520d925fffff", "count": 574}, {"bytes": 14898, "cell": "886520d95dfffff", "count": 625}, {"bytes": 17185, "cell": "886520d943fffff", "count": 722}, {"bytes": 18908, "cell": "886520d86dfffff", "count": 794}]
```

## Manifest Hash And Size

```text
Algorithm : SHA256
Hash      : 1D94140FC5317967747B6D4B556F8686222900B30579995A921ED4ECA6CAA401
Path      : C:\sgSHIOK2026\qa\p21\lamp_overlay_h3r8_preview\manifest.json

file_count=701
total_bytes=3146697
```

## Focused Verification

```text
..........                                                               [100%]
10 passed in 1.60s
```

## Evidence Path Ignore Check

```text
exit=1
```

## Full Python Verification

```text
........................................................................ [ 20%]
........................................................................ [ 41%]
........................................................................ [ 62%]
........................................................................ [ 83%]
.........................................................                [100%]
345 passed in 253.62s (0:04:13)
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Protected File Check

```text
exit=0
```

## FINDINGS

1. The raw lamp-post source can be converted into a compact, viewport-friendly artifact without rescoring or touching any existing public bundle: 41,907,845 raw bytes became 3,146,697 bytes across 700 H3-r8 tiles plus one manifest.
2. The current source has 126,144 valid point features and 0 skipped features under the builder's Point-only validation.
3. H3 resolution 8 is viable for the first browser strategy: the largest measured tile is 794 points / 18,908 bytes, small enough for viewport-based fetches.
4. The artifact path is now repeatable through `run.py lamp-overlay`, and the builder refuses non-empty output directories to preserve versioned, never-in-place artifact handling.

## DISAGREEMENTS

1. I did not commit the generated `qa/p21/lamp_overlay_h3r8_preview/` artifact. It is local measurement output; the committed deliverable is the deterministic builder and evidence.
2. I did not place the artifact under `web/public/data/` or add a map toggle yet. That is the user-visible shipping step, but it should happen in a new versioned public-data directory after the artifact strategy is reviewed.
