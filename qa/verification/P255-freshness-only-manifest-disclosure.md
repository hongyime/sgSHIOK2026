# P255 freshness-only manifest disclosure

## Root guard

```text
ROOT_OK C:\sgSHIOK2026
HOST PRAWN-E14
```

## Scope

`run.py check --freshness-only` already read `raw/manifest.json` without probing upstream URLs, but its printed output did not say that explicitly. The command now prints:

```text
Manifest-only check: no upstream URLs were probed.
```

## Focused tests

```text
uv run pytest tests/test_fetch.py -q
..................                                                       [100%]
18 passed in 3.03s
```

## Freshness-only command

```text
uv run python run.py check --freshness-only
Source freshness from raw/manifest.json at 2026-08-20T23:44:08.480637+00:00...
Manifest-only check: no upstream URLs were probed.
```

## FINDINGS

1. The zero-mutation freshness command could still be misread as an upstream freshness probe because its output did not explicitly say no upstream URLs were probed.
2. The command now states its manifest-only scope in stdout, matching the README caveat that local `current` status is not proof that no newer upstream release exists.
3. This was CLI disclosure/test work only. No upstream probe, fetch, ingest, input mutation, scoring, export, public-data write, deployment, or locked weight change was run.

## DISAGREEMENTS

1. None.
