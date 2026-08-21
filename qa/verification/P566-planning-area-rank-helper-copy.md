# P566 Planning-Area Rank Helper Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Stop calling every planning-area comparison option an evidence view. Crossing friction is a locked term in this release, so the helper copy and screen-reader chooser now use comparison-view language and reserve evidence-view language for evidence metrics.

## Commands

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\subscore-ranking.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  50 passed (50)
   Start at  07:49:51
   Duration  1.83s (transform 1.00s, setup 0ms, import 1.42s, tests 440ms, environment 1ms)
```

### Diff check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

### Full web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  151 passed (151)
   Start at  07:50:10
   Duration  8.27s (transform 5.69s, setup 0ms, import 7.44s, tests 11.95s, environment 12ms)
```

### Python collect-only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 15.00s
```

### Repository integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

### Evidence check-ignore

```text
check_ignore_exit=1
```

### Protected path diff

```text
```

## Findings

1. After P565 fixed the rank option labels, the surrounding rank-panel helper still called every non-overall option a planning-area evidence view. That was inaccurate for the crossing-friction locked term.

## Disagreements

1. None.
