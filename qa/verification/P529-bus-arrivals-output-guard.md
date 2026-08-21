# P529 bus-arrivals output guard

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Free-tier command-safety work only. No live LTA calls, scoring, export, rescore, subset run, ingest, network build, deployment, raw-data write, public-data write, protected QA mutation, `checksums.json` mutation, or `pipeline/config/weights.yaml` mutation.

## Finding

`pipeline.bus_arrivals` is an API-calling collector with an append target under `raw/`:

```text
pipeline/bus_arrivals.py:21:DEFAULT_OUTPUT = PROJECT_ROOT / "raw" / "bus_arrivals" / "arrivals.jsonl"
pipeline/bus_arrivals.py:116:    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
```

The write path appends JSONL records and creates parents:

```text
pipeline/bus_arrivals.py:58:def append_jsonl(path: Path, records: list[dict[str, Any]]) -> int:
pipeline/bus_arrivals.py:59:    path.parent.mkdir(parents=True, exist_ok=True)
pipeline/bus_arrivals.py:60:    with open(path, "a", encoding="utf-8") as f:
```

That made a bare `bus-arrivals collect` command capable of calling LTA and appending under `raw/` without explicitly naming a local snapshot path.

## Change

The `pipeline.bus_arrivals` CLI now fails closed:

- `collect` requires explicit `--output`;
- the guard runs before any fetch;
- direct helper calls remain usable with explicit output paths;
- `run.py` now describes `bus-arrivals` as requiring explicit `--output`.

## Command Output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_bus_arrivals.py tests/test_run.py -q
....................                                                     [100%]
20 passed in 2.73s
```

```text
PS C:\sgSHIOK2026> git diff --check
```

No output, exit 0.

## FINDINGS

1. `pipeline.bus_arrivals` had a bare CLI path that could both call LTA and append to `raw/bus_arrivals/arrivals.jsonl` by default.
2. This collector is explicitly for future reliability scoring, so local snapshot collection should be deliberate and named, not a default raw write.

## DISAGREEMENTS

1. None.
