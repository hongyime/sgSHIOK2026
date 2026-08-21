# P528 score-batch output guard

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier command-safety work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA mutation, `checksums.json` mutation, or `pipeline/config/weights.yaml` mutation.

## Finding

`pipeline.score_batch` had a write-capable CLI default:

```text
pipeline/score_batch.py:30:DEFAULT_OUTPUT_DIR = PROCESSED_DIR / "score_batches"
pipeline/score_batch.py:499:    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
```

The batch writer creates chunk and manifest parents as needed:

```text
pipeline/score_batch.py:65:def write_json(path: Path, payload: Any) -> int:
pipeline/score_batch.py:66:    path.parent.mkdir(parents=True, exist_ok=True)
pipeline/score_batch.py:68:    path.write_bytes(content)
```

That made a non-dry operator invocation capable of writing under `processed/score_batches` without explicitly naming a run directory.

## Change

The score-batch CLI now fails closed:

- non-dry runs require explicit `--output-dir`;
- the guard fires before loading a missing postal universe or scoring;
- dry runs remain allowed without `--output-dir` because they write nothing and still report the default target;
- `run.py` now describes `score-batch` as requiring explicit `--output-dir` for non-dry runs.

The lower-level `build_score_batch()` helper remains unchanged so existing tests and approved scripts can pass explicit directories directly.

## Command Output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_score_batch.py tests/test_run.py -q
........................                                                 [100%]
24 passed in 12.80s
```

```text
PS C:\sgSHIOK2026> git diff --check
```

No output, exit 0.

## FINDINGS

1. `pipeline.score_batch` had a non-dry CLI path that defaulted output writes into `processed/score_batches`. That was inconsistent with the one-attempt/explicit-run-directory release boundary.
2. The safe boundary is at the CLI: approved scripts such as `scripts/full-rescore-production.ps1` already pass explicit per-run output directories, and `build_score_batch()` still supports that direct call pattern.

## DISAGREEMENTS

1. None.
