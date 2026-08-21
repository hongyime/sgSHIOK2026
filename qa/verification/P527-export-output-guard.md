# P527 export output guard

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier command-safety work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected QA mutation, `checksums.json` mutation, or `pipeline/config/weights.yaml` mutation.

## Finding

`pipeline.export` still had write-capable CLI actions with default output targets:

```text
pipeline/export.py:44:DEFAULT_EXPORT_DIR = PROJECT_ROOT / "web" / "public" / "data" / "generated"
pipeline/export.py:2239:    export_parser.add_argument("--output", type=Path, default=DEFAULT_EXPORT_DIR)
pipeline/export.py:2262:    transit_parser.add_argument("--output", type=Path, default=DEFAULT_EXPORT_DIR)
pipeline/export.py:2265:    provenance_parser.add_argument("--output", type=Path, default=DEFAULT_EXPORT_DIR)
```

The helper also creates parents before writing:

```text
pipeline/export.py:70:def write_json(path: Path, payload: Any) -> int:
pipeline/export.py:71:    path.parent.mkdir(parents=True, exist_ok=True)
pipeline/export.py:73:    path.write_bytes(content)
```

That is inconsistent with the current release rule: version output artifacts numerically and never repair or overwrite a frozen artifact in place.

## Change

The write-capable CLI actions now fail closed:

- `export` requires explicit `--output` and refuses a non-empty target before loading `--records-dir` records or scoring live.
- `export-transit` requires explicit `--output` and refuses a non-empty target.
- `refresh-provenance` requires explicit `--output` and names itself as an in-place manifest mutation.
- `validate` remains read-only and keeps its default input.
- `run.py --help` now lists `refresh-provenance` as a gated task and says it is fail-closed.

## Command Output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_export.py -q
......................................                                   [100%]
38 passed in 69.01s (0:01:09)
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_export.py tests/test_run.py -q
.............................                    [100%]
53 passed in 35.61s
```

```text
PS C:\sgSHIOK2026> git diff --check
```

No output, exit 0.

## FINDINGS

1. `pipeline.export` had three write-capable CLI actions with implicit default output directories. That was a real operator-safety gap because a mistaken export command could write under `web/public/data/generated` without making the operator choose a fresh bundle path.
2. `refresh-provenance` is intentionally an in-place manifest mutation. It should not be exposed as a harmless runner shortcut; it now fails unless the bundle path is named explicitly.
3. The lower-level `export_static_artifacts()` helper remains usable for tests and direct code paths with explicit temp directories. The fail-closed behavior is at the operator CLI boundary where accidental release artifact mutation happens.

## DISAGREEMENTS

1. None.
