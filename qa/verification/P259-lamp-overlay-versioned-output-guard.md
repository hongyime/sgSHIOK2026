# P259 lamp overlay versioned output guard

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`
Date: 2026-08-21

## Command output

```text
> uv run pytest tests/test_lamp_overlay.py -q
....                                                                     [100%]
4 passed in 1.77s
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
> git diff -- pipeline/config/weights.yaml
```

```text
> git diff --stat
 pipeline/lamp_overlay.py   | 13 +++++++++++++
 tests/test_lamp_overlay.py | 17 ++++++++++++++++-
 2 files changed, 29 insertions(+), 1 deletion(-)
```

## FINDINGS

1. `pipeline.lamp_overlay` already refused non-empty output directories, but it did not reject unversioned target names before creating the directory.
2. Lamp overlay generation now requires the output directory name to end in a positive numeric version tag such as `_v2`, and the new regression test proves an unversioned target is not created.
3. This is zero pipeline cost. It does not build a lamp artifact, mutate existing artifacts, alter public data, score, export, deploy, or touch locked weights.

## DISAGREEMENTS

1. None.
