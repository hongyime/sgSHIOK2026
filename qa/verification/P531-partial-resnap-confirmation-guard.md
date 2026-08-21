# P531 partial resnap confirmation guard

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier command-safety work only. No bounded rescore, scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA mutation, `checksums.json` mutation, or `pipeline/config/weights.yaml` mutation.

## Finding

`scripts.partial_resnap_rescore` reads the active bundle, selects `NO_TRANSIT_IN_RANGE` rows, calls `score_postals()`, and writes a report:

```text
scripts/partial_resnap_rescore.py:133:def build_report(
scripts/partial_resnap_rescore.py:152:    records = load_bundle_records(bundle_dir)
scripts/partial_resnap_rescore.py:164:    rescored = score_postals(
scripts/partial_resnap_rescore.py:205:    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
```

The CLI previously defaulted to the active bundle and `qa/partial_resnap_rescore_sample.json` without an explicit confirmation gate.

## Change

The partial resnap CLI now fails closed unless both are supplied:

- `--confirm-rescore`
- explicit `--output`

The guard runs before active-bundle lookup and before any call to `score_postals()`.

## Command Output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_partial_resnap_rescore.py -q
....                                                                     [100%]
4 passed in 2.78s
```

```text
PS C:\sgSHIOK2026> git diff --check
```

No output, exit 0.

## FINDINGS

1. `scripts.partial_resnap_rescore` is a scoring helper, not a report-only audit. Its previous CLI could start from the active bundle and default report path without explicit confirmation.
2. The new guard blocks before active-bundle lookup, so accidental invocations cannot reach bundle reads or scoring setup.

## DISAGREEMENTS

1. None.
