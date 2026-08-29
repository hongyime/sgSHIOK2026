# P939 freshness report source scope

## Working root

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
head=ede7297
ede7297dbea23d4ed0a7d1a0e8ae679a351f5f42	refs/heads/main
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence path ignore check

```text
exit_code=1
```

## Diff stat before commit

```text
 pipeline/fetch.py   | 9 ++++++---
 tests/test_fetch.py | 7 +++++--
 2 files changed, 11 insertions(+), 5 deletions(-)
```

## Focused tests

```text
............................                                             [100%]
28 passed in 12.19s
```

## Diff check

```text
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## weights.yaml diff

```text
```

## FINDINGS

1. The freshness-only report header still named only raw/manifest.json even though the report uses policy from pipeline/config/sources.yaml.
2. The pipeline.fetch help text had the same read-scope understatement as run.py had before P937.

## DISAGREEMENTS

1. None.
