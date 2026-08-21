# P310 CLAUDE Universe Source Policy

## Evidence

Command output is recorded below for the CLAUDE universe-source policy change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Python Test

```text
.                                                                        [100%]
1 passed in 0.91s
```

### Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

### Locked Weights Diff Check

```text
EXIT_CODE=0
```

## FINDINGS

1. `CLAUDE.md` did not carry the measured universe-source policy, so an agent could read the startup doc and miss the P19/P125 evidence before proposing postal-universe v2 work.

## DISAGREEMENTS

1. None.
