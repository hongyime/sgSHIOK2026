# P281 README Full Locked Score Copy

## root guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

## git check-ignore -v qa/verification/P281-readme-full-locked-score-copy.md

```text
EXIT_CODE=1
```

## uv run pytest tests/test_readme.py -q

```text
...                                                                      [100%]
3 passed in 0.90s
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

1. README local-data guidance still said `95,157 full scores`, while the browser availability copy now correctly says `full locked scores`.
2. README now says `95,157 full locked scores out of 124,443 records`, keeping operator-facing documentation aligned with the live first-view wording.
3. This was documentation and test coverage only; no scoring, export, rescore, subset run, ingest, network build, public data write, deploy, or locked-weight change was run.

## DISAGREEMENTS

1. None.
