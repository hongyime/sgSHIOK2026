# P49 Syncbot Restore Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
```

## Incoming Main

```text
From https://github.com/hongyime/sgSHIOK2026
 * [new branch]      dependabot/github_actions/actions/labeler-7 -> origin/dependabot/github_actions/actions/labeler-7
 * [new branch]      dependabot/github_actions/trufflesecurity/trufflehog-3.97.0 -> origin/dependabot/github_actions/trufflesecurity/trufflehog-3.97.0
   08a7031..732a5f6  main       -> origin/main
HEAD=08a7031061c5846bef074948ca8f64150ac3538b
ORIGIN_MAIN=732a5f6d199ca6d745ab9134dc2e7cf5b5f83dbb
LOCAL_NOT_ON_ORIGIN:
ORIGIN_NOT_ON_LOCAL:
732a5f6 chore(deps): bump actions/setup-python from 6 to 7 (#26)
eb313b7 chore(deps): bump actions/checkout from 4 to 7 (#25)
36f963a chore(config): sync from sourcerepo [skip ci]
fa6a71e chore: sync heartbeat [skip ci]
FILES_CHANGED_INCOMING:
M	.github/workflows/bandit.yml
M	.github/workflows/repo-integrity.yml
M	.gitignore
D	.vercelignore
M	AGENTS.md
M	NOTICE
M	last_sync.txt
```

## Syncbot Commit

```text
36f963a chore(config): sync from sourcerepo [skip ci]
 .gitignore    |  7 +------
 .vercelignore | 21 ---------------------
 AGENTS.md     | 34 ++++++++++++----------------------
 NOTICE        | 48 ------------------------------------------------
 4 files changed, 13 insertions(+), 97 deletions(-)
---
36f963a chore(config): sync from sourcerepo [skip ci]
M	.gitignore
D	.vercelignore
M	AGENTS.md
M	NOTICE
```

## Repair Verification

```text
INDEX_NOTICE_BLOB=116404a4b4192d6fd737e54f66f647f7d73fa22d
HEAD_NOTICE_BLOB=1957f3bc714a9aec28141214f512b09fb2f8d832
AGENTS_MATCH_LINES:
15: Repository override for sgSHIOK2026: durable project decisions live in
16: `decisions.md`, not in `.agents/JOURNAL.md`. This repository's `.gitignore`
17: ignores dot-directories unless they are explicitly allowlisted, so `.agents/`
19: explicitly tracks it. Do not put durable product decisions only in `.agents/`.
37: there. In this repository, prefer visible tracked files such as `decisions.md`
50: 3. For durable decisions in this repository, append dated rationale to `decisions.md`.
56: this repository, put durable decisions in `decisions.md`. Put detailed resume
61: `decisions.md`, `.agents/STATE.md` if present, and `git log` over an empty
127: must live in `decisions.md`; `.agents/` is local unless explicitly tracked.
GITIGNORE_ALLOWLIST_LINE:
81: !.vercelignore
CHECK_IGNORE_VERCELIGNORE:
CHECK_IGNORE_EXIT=1
```

## Staged Repair

```text
 .gitignore    |  7 ++++++-
 .vercelignore | 21 +++++++++++++++++++++
 AGENTS.md     | 34 ++++++++++++++++++++++------------
 NOTICE        | 48 ++++++++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 97 insertions(+), 13 deletions(-)
---
M	.gitignore
A	.vercelignore
M	AGENTS.md
M	NOTICE
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Findings

1. `origin/main` advanced to `732a5f6` and included `36f963a chore(config): sync from sourcerepo [skip ci]`, which again damaged the same repository guard files: `NOTICE`, `AGENTS.md`, `.gitignore`, and `.vercelignore`.
2. The repair preserves the incoming dependency workflow updates and heartbeat file, and restores only the repository guard files from the last good main.
3. `git check-ignore -v .vercelignore` exits 1 after the repair, so `.vercelignore` is again trackable.

## Disagreements

1. None for this repair.
