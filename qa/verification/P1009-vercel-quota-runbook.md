# P1009 Vercel Quota Runbook

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### uv run pytest tests/test_readme.py -q

```text
....                                                                     [100%]
4 passed in 2.73s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
```

### git check-ignore -v qa/verification/P1009-vercel-quota-runbook.md

```text
p1009_check_ignore_exit=1
```

### git diff --stat before commit

```text
 README.md            | 6 ++++++
 decisions.md         | 3 +++
 tests/test_readme.py | 6 ++++++
 3 files changed, 15 insertions(+)
```

## FINDINGS

1. README publish guidance did not yet carry the measured Vercel quota incident response from P1006-P1008.
2. The durable runbook answer is: first check whether production is serving current `main`; if not, repository cache/crawler reductions are not live. Immediate hard stops are Vercel project pause/protection decisions because they affect public availability.
3. This is documentation and test coverage only. It does not deploy, mutate Vercel settings, score, export, rescore, ingest, build network, mutate public data, protected evidence, inputs, or locked weights.

## DISAGREEMENTS

1. None for this change.
