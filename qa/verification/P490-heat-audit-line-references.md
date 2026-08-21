# P490 Heat Audit Line References

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P490-heat-audit-line-references.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Pre-Fix Measurement

```text
Command: uv run python -c "from scripts.analysis import analyze_heat_presentation as a; entries=a.validate_ui_entries(a.PROJECT_ROOT); import sys; [print(e['file'], e['line'], 'line_match=', e['line_match'], 'expected_line_match=', e['expected_line_match'], 'found_line=', e['found_line']) or (None if e['expected_line_match'] else (print(' expected:', e['string']), print(' actual  :', e['actual_line']))) for e in entries]"
web/app/layout.tsx 7 line_match= True expected_line_match= False found_line= 6
 expected: Explore covered-walkway ratio, exposed gaps, night lighting evidence, and the secondary locked SHIOK score for Singapore walks to transit.
 actual  : 
web/app/page.tsx 96 line_match= True expected_line_match= True found_line= 96
web/app/page.tsx 1141 line_match= True expected_line_match= False found_line= 1228
 expected: Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}; greenery proxy ${formatDistance(score.paths.shade_m)}.
 actual  : </div>
web/app/page.tsx 1200 line_match= True expected_line_match= False found_line= 1319
 expected: label: "Shelter exposure",
 actual  : );
web/app/page.tsx 1206 line_match= True expected_line_match= False found_line= 1325
 expected: In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence.
 actual  : rankMetricLabel,
web/app/page.tsx 1207 line_match= True expected_line_match= False found_line= 1326
 expected: Heat also includes the sparse NParks greenery proxy, so SHIOK shows the shelter trace first.
 actual  : });
web/app/page.tsx 1369 line_match= True expected_line_match= False found_line= 1489
 expected: <span>Four display rows; weights unchanged</span>
 actual  : <div>
web/app/page.tsx 2062 line_match= True expected_line_match= False found_line= 2189
 expected: Heat proxy: shelter plus sparse NParks greenery, not measured temperature
 actual  : }
web/lib/transit-popup.ts 28 line_match= True expected_line_match= True found_line= 28
```

## Post-Fix Measurement

```text
Command: uv run python -c "from scripts.analysis import analyze_heat_presentation as a; entries=a.validate_ui_entries(a.PROJECT_ROOT); print('entries', len(entries)); print('line_mismatches', sum(1 for e in entries if not e['line_match'])); print('expected_line_mismatches', sum(1 for e in entries if not e['expected_line_match'])); [print(e['file'], e['line'], e['found_line'], e['expected_line_match']) for e in entries]"
entries 9
line_mismatches 0
expected_line_mismatches 0
web/app/layout.tsx 6 6 True
web/app/page.tsx 96 96 True
web/app/page.tsx 1228 1228 True
web/app/page.tsx 1319 1319 True
web/app/page.tsx 1325 1325 True
web/app/page.tsx 1326 1326 True
web/app/page.tsx 1489 1489 True
web/app/page.tsx 2189 2189 True
web/lib/transit-popup.ts 28 28 True
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_heat_presentation_analysis.py -q
....                                                                     [100%]
4 passed in 2.49s
```

## FINDINGS

1. Seven of nine heat-presentation UI audit entries had stale line numbers even though their strings still existed elsewhere in the files.
2. The focused test only required string existence, so stale audit locations could persist unnoticed.

## DISAGREEMENTS

1. None.
