# P565 Planning-Area Rank Labels

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Rename planning-area rank metric labels so the dropdown names the evidence users can inspect, not the old locked-term shorthand.

## Commands

### Focused web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\subscore-ranking.test.ts C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  49 passed (49)
   Start at  07:45:20
   Duration  2.91s (transform 1.92s, setup 0ms, import 2.47s, tests 775ms, environment 1ms)
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
      Tests  150 passed (150)
   Start at  07:45:46
   Duration  18.07s (transform 13.68s, setup 0ms, import 18.80s, tests 26.28s, environment 26ms)
```

### Python collect-only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 31.46s
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

1. Planning-area rank labels still exposed old locked-term names such as `Rain-shelter evidence` and `Transit-access evidence`, which did not match the visible evidence users can inspect.
2. The crossing rank is still a locked score term rather than user-inspectable evidence, so the label now names it as `Crossing-friction locked term` instead of implying a first-class evidence view.

## Disagreements

1. None.
