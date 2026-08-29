# P1010 Agent Vercel Quota Boundary

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

### uv run pytest tests/test_agent_docs.py -q

```text
...                                                                      [100%]
3 passed in 8.38s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
```

### git check-ignore -v qa/verification/P1010-agent-vercel-quota-boundary.md

```text
p1010_check_ignore_exit=1
```

### git diff --stat before commit

```text
 CLAUDE.md                | 6 ++++++
 decisions.md             | 3 +++
 tests/test_agent_docs.py | 6 ++++++
 3 files changed, 15 insertions(+)
```

## FINDINGS

1. `CLAUDE.md` carried the $0/Vercel Hobby and publish rules, but not the P1006-P1009 quota incident boundary.
2. Future agents now see that Vercel Hobby Edge Request incidents should first check whether production is serving current `main`, because automatic Git deployments are disabled and committed cache/crawler reductions need owner manual deployment to affect live traffic.
3. The agent guidance now states that pausing or protecting the Vercel project changes public availability and is an owner decision, not an agent-default repository mutation.
4. This is documentation and test coverage only. It does not deploy, mutate Vercel settings, score, export, rescore, ingest, build network, mutate public data, protected evidence, inputs, or locked weights.

## DISAGREEMENTS

1. None for this change.
