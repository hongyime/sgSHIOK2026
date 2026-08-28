# P701 Mayflower QA summary output guard

## Working root

```text
C:\sgSHIOK2026
```

## Existing default outputs

```text
present 9418 C:\sgSHIOK2026\qa\mayflower_route_qa_summary_20260801.json
present 1541 C:\sgSHIOK2026\qa\mayflower_route_qa_summary_20260801.md
qa/mayflower_route_qa_summary_20260801.json
qa/mayflower_route_qa_summary_20260801.md
exit=1
```

## CLI no-argument guard

```text
{
  "errors": [
    "Mayflower QA summary requires explicit --output-json",
    "Mayflower QA summary requires explicit --output-md",
    "refusing to overwrite existing analysis output: C:\\sgSHIOK2026\\qa\\mayflower_route_qa_summary_20260801.json",
    "refusing to overwrite existing analysis output: C:\\sgSHIOK2026\\qa\\mayflower_route_qa_summary_20260801.md"
  ]
}
exit=2
```

## Focused tests

```text
.......                                                                  [100%]
7 passed in 7.09s
```

## Test collection

```text
474 tests collected in 11.41s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. `scripts/mayflower_qa_summary.py` defaulted to tracked `qa/mayflower_route_qa_summary_20260801.json` and `.md` outputs. A no-argument rerun could replace existing Mayflower QA evidence after reading the active bundle and audit inputs.
2. The script now requires explicit `--output-json` and `--output-md`, refuses existing JSON/markdown/gap GeoJSON outputs before input reads, and keeps optional gap output non-overwriting.

## DISAGREEMENTS

1. None.
