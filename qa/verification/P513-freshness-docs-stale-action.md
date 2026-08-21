# P513 freshness docs stale action

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
8ebf30ba6acc971ddc52d941e382c2465a390815
8ebf30ba6acc971ddc52d941e382c2465a390815	refs/heads/main
```

```text
check_ignore_exit=1
```

## Focused docs tests

Command:

```text
uv run pytest tests/test_readme.py tests/test_agent_docs.py -q
```

Output:

```text
.....                                                                    [100%]
5 passed in 1.31s
```

## Diff summary

```text
README.md and CLAUDE.md now state that stale sources should be reported and handled by planning a versioned refresh, not by mutating frozen v1 in place.
tests/test_readme.py and tests/test_agent_docs.py assert that operator-facing documentation keeps that stale-source action.
```

## FINDINGS

1. README and CLAUDE documented the zero-mutation freshness command and named summaries, but did not yet tell operators the stale-source release action.
2. The docs now match the CLI and readiness behavior: stale source freshness means report it and plan a versioned refresh; frozen v1 must not be mutated in place.

## DISAGREEMENTS

1. None.
