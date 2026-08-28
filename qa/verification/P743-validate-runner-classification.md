# P743 Validate Runner Classification

## Startup

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

`pipeline.export validate` reads an existing static bundle and prints validation results. It does not write bundle artifacts, score, export, or deploy. The runner documentation now lists `validate` with safe reports and leaves `publish` as the gated deployment boundary.

No scoring, export, rescore, subset scoring, ingest, network build, bundle validation run, public-data write, protected QA evidence mutation, deployment, or locked-weight change was performed.

## Verification

```text
..............................................................           [100%]
62 passed in 4.31s
```

```text
567 tests collected in 22.42s
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

1. `run.py validate` was still documented as a gated pipeline task even though the implementation calls `validate_static_artifacts()` and prints the report without writing.
2. The stale classification made the safety model harder to read after P739-P742: the genuinely dangerous action is `publish`, which remains gated and continues to run validation first.

## Disagreements

1. None.
