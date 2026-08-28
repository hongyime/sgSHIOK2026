# P716 OneMap probe task-runner exposure

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, OneMap probe, input mutation, public-data write, protected payload write, or deployment.

## Change

`run.py` now exposes the guarded OneMap sustained-rate probe as `onemap-probe`, with help text that names it as network-heavy and records the explicit `--output` plus `--confirm-onemap-probe` requirements.

This makes the future OneMap enumeration-feasibility probe discoverable without encouraging direct unguarded module execution.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
.....................                                                    [100%]
21 passed in 3.95s
```

```text
503 tests collected in 18.29s
```

```text
repo_integrity=ok
exit=0
```

```text
exit=0
```

```text
exit=0
```

## FINDINGS

1. After P715, the OneMap rate probe was fail-closed but not discoverable through `run.py`, leaving future users to invoke the module path directly.
2. The runner now routes `onemap-probe` to `pipeline.probe_onemap` while preserving that module's explicit output and confirmation gates.

## DISAGREEMENTS

1. None.
