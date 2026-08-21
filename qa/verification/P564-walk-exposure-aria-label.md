# P564 Walk Exposure Aria Label

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Rename the exposure hero's non-visual label from `Walk shelter evidence` to `Walk exposure evidence`, matching the visible section that shows covered-walkway ratio and exposed gaps.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  29 passed (29)
   Start at  07:40:03
   Duration  1.49s (transform 564ms, setup 0ms, import 778ms, tests 326ms, environment 0ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
```

## Aria Label Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:438:    expect(html).toContain('aria-label="Walk exposure evidence"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:439:    expect(html).not.toContain('aria-label="Walk shelter evidence"');
C:\sgSHIOK2026\web\app\page.tsx:1443:        <div className={styles.exposureHero} aria-label="Walk exposure evidence">
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:40:27
   Duration  11.59s (transform 9.51s, setup 0ms, import 12.49s, tests 16.61s, environment 34ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 27.11s
```

## Repository Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence Ignore Check

```text
check_ignore_exit=1
```

## Protected Diff Check

```text

```

## Findings

1. The visible hero says `Where the walk is exposed`, but its aria label still used the less direct phrase `Walk shelter evidence`.
2. The non-visual label now says `Walk exposure evidence`, matching the visible covered-walkway and exposed-gap content.

## Disagreements

1. None.