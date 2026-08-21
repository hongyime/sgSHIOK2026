# P504 README freshness summary names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

README operator guidance now says `run.py check --freshness-only` grouped action summaries include source display names, so the docs match the P502 CLI report and P503 first-view freshness copy.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_readme.py -q
....                                                                     [100%]
4 passed in 0.82s
```

## FINDINGS

1. README documented the zero-mutation freshness report and its status classes, but not the newer source-name summaries that make the report actionable without cross-referencing `sources.yaml`.
2. This is docs/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
