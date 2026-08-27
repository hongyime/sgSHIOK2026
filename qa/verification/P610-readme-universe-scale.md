# P610 README Universe Scale

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

Free-tier documentation and test coverage only.

No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data writes, protected QA mutation, deployment, or locked-weight changes were performed.

## Focused README tests

```text
....                                                                     [100%]
4 passed in 2.19s
```

## Python collect-only

```text
457 tests collected in 16.27s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Evidence path check-ignore

```text
exit=1
```

## Protected-path diff

```text
exit=0
```

## FINDINGS

1. README now matches the P609 consolidated universe-status output by distinguishing the 0.61% confirmed missing-row rate from the 0.82% warning-inclusive rate.
2. README now states the directional frozen-v1 scale estimate of 765 confirmed missing rows or 1,020 including warnings, and explicitly says this is not a measured full-universe gap.
3. This keeps operator docs aligned with the standing measurement-first rule: the current cached evidence points to a small sampled current-source gap, not a product-reshaping twenty-thousand-record gap.

## DISAGREEMENTS

1. None.
