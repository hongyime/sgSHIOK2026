# P745 Agent Publish Instructions

## Startup

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

`CLAUDE.md` still grouped `validate` with gated pipeline tasks and described `uv run python run.py publish` without the runner-owned `--confirm-publish` or module-owned `--confirm-production` flags.

The guide now lists `validate` with safe reports and documents the publish command as `uv run python run.py publish --confirm-publish --deploy --confirm-production`.

No deployment, bundle validation run, export, scoring, rescore, subset scoring, ingest, network build, public-data write, protected QA evidence mutation, or locked-weight change was performed.

## Verification

```text
.................................................................        [100%]
65 passed in 3.96s
```

```text
568 tests collected in 45.66s
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

1. The runner and README were aligned in P743-P744, but the agent guide still carried stale publish and validate instructions.
2. A source-text test now pins the publish command and the validate/read-only classification in `CLAUDE.md`.

## Disagreements

1. None.
