# P1018 Section 10 Reference Current Copy

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Section 10 reference documentation, tests, decision entry, and evidence only. No rendered browser-code change, Vercel project mutation, deploy, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, dependency install, or locked-weight change.

## Command Output

### npm --prefix web test -- score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  01:00:01
   Duration  1.34s (transform 258ms, setup 0ms, import 309ms, tests 214ms, environment 1ms)
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

### git check-ignore -v qa/verification/P1018-section10-reference-current-copy.md

```text
check_ignore_exit=1
```

### git diff --stat

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                              |  3 +++
 web/lib/__tests__/score-card-copy.test.ts |  7 ++++++-
 web/section10-presentation-proposal.md    | 18 +++++++++---------
 3 files changed, 18 insertions(+), 10 deletions(-)
```

## FINDINGS

1. The Section 10 implemented-state reference still used older `Walk to transit` row language after the browser row had moved to `Walk to stop or exit`.
2. The reference still exposed `NParks greenery proxy` in user-facing copy examples, while current browser copy uses `nearby greenery`.
3. This change updates the reference and source-string tests only. It does not alter rendered browser code, scoring, exports, inputs, public data, deployment, protected payloads, or locked weights.

## DISAGREEMENTS

1. None.
