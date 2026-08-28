# P715 OneMap probe guard

## Working root

```text
C:\sgSHIOK2026
```

## Scope

Zero pipeline cost. No scoring, export, rescore, subset run, ingest, network build, OneMap probe, input mutation, public-data write, protected payload write, or deployment.

## Change

`pipeline.probe_onemap` no longer runs a sustained-rate OneMap probe from direct execution without explicit intent. The CLI now requires a fresh `--output` path and `--confirm-onemap-probe`, refuses the historical `logs/onemap_probe.csv` default path, and refuses existing outputs before any request loop can start.

`run_ladder_probe()` also refuses existing output paths and opens the CSV with exclusive creation.

## Command Output

```text
root=C:\sgSHIOK2026
```

```text
....                                                                     [100%]
4 passed in 2.00s
```

```text
502 tests collected in 13.06s
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

1. Direct execution of `pipeline/probe_onemap.py` previously launched a multi-rung OneMap rate probe and overwrote `logs/onemap_probe.csv` with no explicit output or confirmation.
2. The probe is useful future enumeration evidence, but it is network-heavy enough that accidental execution should fail closed.

## DISAGREEMENTS

1. None.
