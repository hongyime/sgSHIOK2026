# P742 Report Runner Gates

## Startup

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Added runner-level confirmations before `run.py` launches the remaining report writers and external probes:

- `network-debug`
- `onemap-validation collect`
- `onemap-outlier-replay`
- `onemap-outlier-triage`
- `overture-addresses`
- `compare-targeted`

No scoring, export, rescore, subset scoring, ingest, network build, OneMap collection, Overture probing, public-data writes, protected QA evidence mutation, deployment, or locked-weight change was performed.

## Focused Test

```text
..........................................................               [100%]
58 passed in 3.77s
```

## Verification

```text
..........................................................               [100%]
58 passed in 4.88s
```

```text
567 tests collected in 41.21s
```

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## Findings

1. `run.py` still launched several writer/network paths directly after P741: `network-debug`, `onemap-validation collect`, `onemap-outlier-replay`, `onemap-outlier-triage`, `overture-addresses`, and `compare-targeted`.
2. The underlying modules already had some safeguards, especially explicit-output checks, but relying on module startup was inconsistent with the runner-level fail-closed policy established in P739-P741.
3. `onemap-validation plan` and `evaluate` remain runnable without a runner confirmation because they already require explicit fresh `--output` paths and do not collect from OneMap; `collect` is the external-call boundary.

## Disagreements

1. None.
