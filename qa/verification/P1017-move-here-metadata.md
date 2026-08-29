# P1017 Move-Here Metadata

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Browser metadata, tests, decision entry, and evidence only. No Vercel project mutation, deploy, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, dependency install, or locked-weight change.

## Command Output

### First Python audit test run

```text
F                                                                        [100%]
================================== FAILURES ===================================
____________ test_heat_presentation_ui_audit_entries_still_resolve ____________

    def test_heat_presentation_ui_audit_entries_still_resolve() -> None:
        entries = analyze_heat_presentation.validate_ui_entries(
            analyze_heat_presentation.PROJECT_ROOT
        )
    
        assert entries
>       assert [entry for entry in entries if not entry["line_match"]] == []
E       AssertionError: assert [{'file': 'we...laims.', ...}] == []
E         
E         Left contains 6 more items, first extra item: {'file': 'web/app/layout.tsx', 'line': 6, 'string': 'Explore covered-walkway ratio, exposed gaps, the night-lighting m... 'verdict': 'Acceptable: metadata leads with the shelter/exposure artifact and keeps the locked score secondary.', ...}
E         Use -v to get more diff

tests\test_heat_presentation_analysis.py:80: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve
1 failed in 3.97s
```

### npm --prefix web test -- score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  00:55:33
   Duration  4.54s (transform 1.04s, setup 0ms, import 1.22s, tests 696ms, environment 1ms)
```

### uv run pytest tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve -q

```text
.                                                                        [100%]
1 passed in 5.46s
```

### uv run python -c "from scripts.analysis import analyze_heat_presentation as a; entries=a.validate_ui_entries(a.PROJECT_ROOT); print('entries', len(entries)); print('line_mismatches', sum(1 for e in entries if not e['line_match'])); print('expected_line_mismatches', sum(1 for e in entries if not e['expected_line_match']))"

```text
entries 9
line_mismatches 0
expected_line_mismatches 0
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

### git check-ignore -v qa/verification/P1017-move-here-metadata.md

```text
check_ignore_exit=1
```

### git diff --stat

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                  |  3 +++
 scripts/analysis/analyze_heat_presentation.py | 31 ++++++++++++---------------
 tests/test_heat_presentation_analysis.py      |  7 +++---
 web/app/layout.tsx                            |  2 +-
 web/lib/__tests__/score-card-copy.test.ts     |  3 ++-
 5 files changed, 24 insertions(+), 22 deletions(-)
```

## FINDINGS

1. After P1016, the rendered first screen carried the move-here promise, but metadata/share descriptions still used generic `Explore...` wording.
2. The heat-presentation UI audit script had multiple stale exact-line entries after later copy work. The strings and line numbers were refreshed to current source instead of weakening the audit.
3. Metadata now starts with `If you moved here...`, keeping covered-walkway ratio, exposed gaps, night-lighting map layer, and the secondary locked SHIOK score as the share-preview promise.
4. This is browser metadata/scripts/test/evidence work only. It does not alter rendered data, search, map behavior, scoring, exports, inputs, public data, deployment, protected payloads, or locked weights.

## DISAGREEMENTS

1. None.
