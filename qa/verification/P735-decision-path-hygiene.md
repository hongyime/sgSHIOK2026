# P735 decision path hygiene

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit_code=1
```

## Decision-path source search

```text
pipeline/scoring_integration.py:1779:    # decisions.md 2026-08-05, qa/scored_partial_regression_diagnosis_20260805.json.
pipeline/scoring_integration.py:1856:    decisions.md 2026-08-05: when the current ``best_transit`` is
pipeline/scoring_integration.py:1869:    Rationale: decisions.md 2026-08-05,
tests/test_scoring_integration.py:2605:# (direct-bus fallback). Rationale: decisions.md 2026-08-05,
tests/test_agent_docs.py:84:        assert "docs/decisions.md" not in text
tests/test_agent_docs.py:85:        assert "decisions.md 2026-08-05" in text
pipeline/export.py:2047:            # decisions.md 2026-08-05 for rationale.
```

## Focused tests

```text
......................................................................   [100%]
70 passed in 22.22s
```

## Collection and integrity

```text
532 tests collected in 16.08s
```

```text
repo_integrity=ok
exit_code=0
```

## Diff checks

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## FINDINGS

1. Five scoring/export comments pointed maintainers to `docs/decisions.md`, but this repository's durable decision log is the root `decisions.md`.
2. The diagnosis artifact path `qa/scored_partial_regression_diagnosis_20260805.json` exists locally; only the decision-file prefix was wrong.
3. The Python collect count moved from 531 to 532 because this change adds one source-text guard preventing the stale decision path from returning.

## DISAGREEMENTS

1. None.
