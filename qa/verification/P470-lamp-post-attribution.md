# P470 Lamp Post Attribution

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

`ATTRIBUTION.md` now lists `lamp_posts` as a shipped LTA Singapore Open Data Licence source used for the separate night lighting map layer, and no longer says lamp posts are unshipped.

`NOTICE` was not changed because repository integrity pins its historical blob.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, lamp-overlay build, or input rebuild was run.

## Focused test

```text
.                                                                        [100%]
1 passed in 1.32s
```

## Evidence path ignore check

```text
EXIT=1
```

## Repository integrity

```text
repo_integrity=ok
EXIT=0
```

## Changed files

```text
ATTRIBUTION.md
decisions.md
tests/test_attribution.py
qa/verification/P470-lamp-post-attribution.md
```

## FINDINGS

1. `ATTRIBUTION.md` still said lamp posts were not identified as reaching shipped artifacts, but the browser now ships a `lamp_posts_v1` night lighting map layer and README/readiness describe that artifact as release-gated.
2. The detailed attribution file linked from the app now reflects the shipped night lighting source.

## DISAGREEMENTS

1. None.
