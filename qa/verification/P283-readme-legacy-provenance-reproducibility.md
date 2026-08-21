# P283 README Legacy Provenance Reproducibility

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P283-readme-legacy-provenance-reproducibility.md

```text
EXIT_CODE=1
```

## uv run pytest tests/test_readme.py -q

```text
....                                                                     [100%]
4 passed in 3.85s
```

## python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT_CODE=0
```

## git diff -- pipeline/config/weights.yaml

```text
EXIT_CODE=0
```

## FINDINGS

1. README still claimed every published score was reproducible from hashed inputs and tagged code, which overstates the active legacy bundle after P17/P15 provenance decisions.
2. README now says the verified fact: published score values, coordinates, and route origins have been independently verified, while the active legacy bundle predates record-level scoring-input and network provenance.
3. This was documentation and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
