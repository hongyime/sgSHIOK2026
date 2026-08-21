# P524 Agent OneMap token controls

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
bd3304f010e39123eb1a0cdc072b2995ab9e24b5
bd3304f010e39123eb1a0cdc072b2995ab9e24b5	refs/heads/main
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_agent_docs.py -q
```

Output:

```text
.                                                                        [100%]
1 passed in 4.96s
```

## Agent doc probe

Command:

```text
Select-String -Path 'C:\sgSHIOK2026\CLAUDE.md' -Pattern 'bounded OneMap Search validation|72-hour token refresh|token-authenticated call-limit' -Context 1,1
```

Output:

```text

  CLAUDE.md:17:evidence, not the primary address registry; any v2 universe is
> CLAUDE.md:18:candidate-source-first with bounded OneMap Search validation under explicit
> CLAUDE.md:19:token controls, 72-hour token refresh, and the current documented
> CLAUDE.md:20:token-authenticated call-limit cap unless SLA approves a higher limit
  CLAUDE.md:21:case-by-case.

```

## FINDINGS

1. `README.md`, batch-plan, and readiness carried the OneMap token/rate boundary, but `CLAUDE.md` only said bounded OneMap Search validation.
2. The agent startup doc now states the same explicit token controls, 72-hour token refresh, and documented token-authenticated call-limit cap boundary before future v2 planning.

## DISAGREEMENTS

1. None.
