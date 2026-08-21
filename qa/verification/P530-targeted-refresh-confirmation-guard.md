# P530 targeted refresh confirmation guard

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier command-safety work only. No targeted scoring, scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA mutation, `checksums.json` mutation, or `pipeline/config/weights.yaml` mutation.

## Finding

`scripts.targeted_bundle_refresh` can copy a bundle, run targeted scoring, delete and rewrite score shards, delete and rewrite geometry shards, and update a manifest:

```text
scripts/targeted_bundle_refresh.py:191:        (scores_dir / f"{shard}.json").unlink(missing_ok=True)
scripts/targeted_bundle_refresh.py:227:    path.unlink(missing_ok=True)
scripts/targeted_bundle_refresh.py:228:    path.with_name(f"{path.name}.gz").unlink(missing_ok=True)
scripts/targeted_bundle_refresh.py:569:    rescored = score_postals(
scripts/targeted_bundle_refresh.py:616:    write_json(manifest_path, manifest)
```

The CLI previously had no explicit confirmation gate before resolving the active bundle, choosing a timestamped target under `web/public/data`, and running `refresh_bundle()`.

## Change

The targeted bundle refresh CLI now fails closed unless `--confirm-targeted-refresh` is supplied. The guard runs before active-bundle lookup, target path construction, bundle copying, scoring, or shard mutation.

The lower-level helper remains available for tests and deliberately confirmed scripts.

## Command Output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_targeted_bundle_refresh.py -q
............                                                             [100%]
12 passed in 14.02s
```

```text
PS C:\sgSHIOK2026> git diff --check
```

No output, exit 0.

## FINDINGS

1. `scripts.targeted_bundle_refresh` is a scoring and bundle-mutation tool, not a report. A bare CLI path without confirmation was too easy to run accidentally.
2. The new guard blocks before active bundle lookup, so it also avoids accidentally touching the configured published bundle path when the operator only meant to inspect help or dry options.

## DISAGREEMENTS

1. None.
