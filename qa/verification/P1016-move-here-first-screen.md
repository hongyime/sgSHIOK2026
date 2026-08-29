# P1016 Move-Here First Screen

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Browser copy, tests, decision entry, and evidence only. No Vercel project mutation, deploy, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, dependency install, or locked-weight change.

## Command Output

### First focused test run

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (11 tests | 1 failed) 949ms
     × uses sheltered walk copy in non-visual map summaries 55ms

AssertionError: expected source to contain:
If you moved here, inspect covered-walkway ratio and exposed gaps on the walk to a transit stop or exit, plus the night-lighting map layer.

The failure showed that the RouteEvidenceMap non-visual empty-state summary still used the older search-oriented prompt after the title card and empty panel were updated.
```

### npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  00:48:51
   Duration  4.96s (transform 1.27s, setup 0ms, import 1.30s, tests 1.63s, environment 2ms)
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

### git check-ignore -v qa/verification/P1016-move-here-first-screen.md

```text
check_ignore_exit=1
```

### git diff --stat

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                             | 3 +++
 web/app/page.tsx                                         | 4 ++--
 web/components/route-evidence-map.tsx                    | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx          | 3 +++
 web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
 web/lib/__tests__/score-card-copy.test.ts                | 7 ++++++-
 6 files changed, 17 insertions(+), 5 deletions(-)
```

## FINDINGS

1. The first-screen copy described the feature but did not directly state the residential decision question from the standing goal.
2. The title card, empty shelter-map panel, and non-visual map summary now use `If you moved here...`, keeping covered-walkway ratio, exposed gaps, stop/exit walks, and the night-lighting map layer as the visible evidence.
3. This is browser copy/test/evidence work only. It does not alter search behavior, map behavior, scoring, exports, inputs, public data, deployment, protected payloads, or locked weights.

## DISAGREEMENTS

1. None.
