# P1015 Vercel Hard Controls Runbook

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Documentation and tests only. No Vercel project mutation, deploy, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, dependency install, or locked-weight change.

## Command Output

### Vercel documentation search

```text
Read-only Vercel documentation search identified:
- POST /v1/projects/{projectId}/pause blocks the active Production Deployment.
- vercel project protection can show or toggle deployment protection.
- Vercel Firewall custom rules can deny requests.
- vercel firewall attack-mode enable can challenge traffic temporarily.
```

### uv run pytest tests/test_readme.py tests/test_agent_docs.py -q

```text
.......                                                                  [100%]
7 passed in 1.72s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
repo_integrity_exit=0
```

### git diff -- pipeline/config/weights.yaml

```text
weights_diff_exit=0
```

### git check-ignore -v qa/verification/P1015-vercel-hard-controls-runbook.md

```text
check_ignore_exit=1
```

### git diff --stat

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 CLAUDE.md                | 5 +++--
 README.md                | 6 ++++--
 decisions.md             | 3 +++
 tests/test_agent_docs.py | 3 ++-
 tests/test_readme.py     | 4 +++-
 5 files changed, 15 insertions(+), 6 deletions(-)
```

## Vercel Documentation Signals

Read-only Vercel documentation search identified these owner-level controls for a live Edge Request incident:

- Project pause blocks the active Production Deployment.
- Deployment protection can gate access.
- Firewall custom rules can deny requests.
- Attack mode can challenge traffic temporarily.

These controls can reduce or stop traffic, but they change public availability or visitor friction. The repository runbook names them; agents must not apply them by default.

## FINDINGS

1. The existing README/CLAUDE quota runbook named deploy-current-main and project pause/protection, but did not name Vercel firewall deny rules or temporary attack mode.
2. Firewall deny rules and attack mode are operational Vercel controls, not source-code request reductions. They may be the correct emergency response when Edge Requests are exhausted, but they are owner decisions because they affect public access or visitor friction.
3. This change only updates documentation and tests. It does not deploy, mutate Vercel settings, score, export, rescore, ingest, build network, mutate public data, protected evidence, inputs, or locked weights.

## DISAGREEMENTS

1. None.
