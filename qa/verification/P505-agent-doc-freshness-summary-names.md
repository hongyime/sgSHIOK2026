# P505 agent-doc freshness summary names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

`CLAUDE.md` now documents that `run.py check --freshness-only` is zero-mutation, probes no upstream APIs, and includes source display names in grouped action summaries.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_agent_docs.py -q
.                                                                        [100%]
1 passed in 1.32s
```

## FINDINGS

1. Agent-facing docs listed `check --freshness-only` as a safe report but did not carry the same source-name summary guidance added to README and the browser freshness line.
2. This is docs/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
