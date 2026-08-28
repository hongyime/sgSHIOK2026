# P744 Deploy Wrapper Confirmations

## Startup

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

`scripts/deploy-production.ps1` called `uv run python run.py publish --deploy --confirm-production` but omitted the runner-owned `--confirm-publish`. After the P739-P740 publish runner gate, that wrapper would fail before reaching `pipeline.publish` even when deployment was intentionally requested.

The wrapper now passes both `--confirm-publish` and `--confirm-production`.

No deployment, bundle validation run, export, scoring, rescore, subset scoring, ingest, network build, public-data write, protected QA evidence mutation, or locked-weight change was performed.

## Verification

```text
...........................................................              [100%]
59 passed in 1.79s
```

```text
568 tests collected in 13.72s
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

1. `scripts/deploy-production.ps1` was stale after the runner publish gate: it supplied the module confirmation but not the runner confirmation.
2. A source-text test now pins that the deploy wrapper carries both confirmations.

## Disagreements

1. None.
