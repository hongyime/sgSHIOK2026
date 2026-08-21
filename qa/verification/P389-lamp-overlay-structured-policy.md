# P389 Lamp Overlay Structured Policy

## Scope

Free-tier reporting, documentation, and test coverage only. No scoring, export, rescore, ingest, network build, deploy, public-data write, or lamp overlay artifact build was run.

## Working Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

The shared `NIGHT_LIGHTING_LAYER_POLICY` now exposes the same replacement boundary that `run.py --help` and README expose:

```text
replacement_command_example=uv run python run.py lamp-overlay -- --output web/public/data/lamp_posts_v2
owner_approval_required_for_replacement=True
existing_artifact_mutation=forbidden
```

## Policy Readout

Command:

```text
uv run python -c "from pipeline.batch_plan import NIGHT_LIGHTING_LAYER_POLICY; import json; print(json.dumps(NIGHT_LIGHTING_LAYER_POLICY, sort_keys=True, indent=2))"
```

Output:

```text
{
  "artifact": "web/public/data/lamp_posts_v1/",
  "existing_artifact_mutation": "forbidden",
  "owner_approval_required_for_replacement": true,
  "release_gate": "production readiness validates manifest, source identity, tile index, tile files, and tile byte totals",
  "replacement_command_example": "uv run python run.py lamp-overlay -- --output web/public/data/lamp_posts_v2",
  "role": "separate night-lighting map layer",
  "score_role": "not part of the locked score",
  "source_key": "lamp_posts",
  "versioning": "new lamp overlay artifacts must use a new numbered directory"
}
```

## Focused Tests

Command:

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -p no:cacheprovider
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 35 items

tests\test_batch_plan.py ..........                                      [ 28%]
tests\test_production_readiness.py .........................             [100%]

============================= 35 passed in 35.52s =============================
```

## FINDINGS

1. P388 exposed `lamp-overlay` in runner help and README, but the structured batch-plan/readiness source-policy block still omitted the runner command and owner-approval replacement boundary.
2. The night-lighting policy is now consistent across operator help, README, batch-plan, and production-readiness features.

## DISAGREEMENTS

1. None.
