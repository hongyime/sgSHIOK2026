# P269 Night-Lighting Source Policy

## Working Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Evidence Path Ignore Check

```text
EXIT=1
```

## Change

Dry-run batch planning and production readiness now expose the settled lamp-post policy in structured source-policy data:

```json
{
  "source_key": "lamp_posts",
  "artifact": "web/public/data/lamp_posts_v1/",
  "role": "separate night-lighting map layer",
  "score_role": "not part of the locked score",
  "release_gate": "production readiness validates manifest, source identity, tile index, tile files, and tile byte totals",
  "versioning": "new lamp overlay artifacts must use a new numbered directory"
}
```

## Focused Tests

Command:

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q
```

Output:

```text
..................................                                       [100%]
34 passed in 38.94s
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
EXIT=0
```

## FINDINGS

1. Lamp posts were already shipped as a versioned night-lighting browser layer and release-gated by production readiness, but the shared structured source-policy block did not expose that settled rule.
2. Source-policy consumers can now see that `lamp_posts` is a separate map layer, not part of the locked score, and that new lamp overlays require new numbered artifact directories.

## DISAGREEMENTS

1. None.
