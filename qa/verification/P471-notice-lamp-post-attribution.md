# P471 NOTICE Lamp Post Attribution

## Startup guard

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

`NOTICE` now uses the S.H.I.O.K. Shelter Map name and lists `lamp_posts` as a shipped LTA Singapore Open Data Licence source. The repository-integrity NOTICE blob tripwire was intentionally advanced to the new blob hash.

No scoring, export, rescore, subset run, ingest, network build, deployment, public data write, lamp-overlay build, or input rebuild was run.

## New NOTICE git blob SHA-1

```text
5ccfd88ea706cb129bc602346d8db34fc8005781
```

## Focused test

```text
.......                                                                  [100%]
7 passed in 3.11s
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
NOTICE
decisions.md
scripts/check_repo_integrity.py
tests/test_repo_integrity.py
qa/verification/P471-notice-lamp-post-attribution.md
```

## FINDINGS

1. `NOTICE` still used the retired S.H.I.O.K. Index name and omitted `lamp_posts`, even though the app now ships `lamp_posts_v1` as the night lighting map layer.
2. Keeping the old NOTICE blob pinned would protect stale attribution. The integrity tripwire now protects the updated attribution block instead.

## DISAGREEMENTS

1. None.
