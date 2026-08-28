# P723 analysis report preflight

## startup root

Command:

```powershell
$ErrorActionPreference='Stop'; if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { Set-Location 'C:\sgSHIOK2026' }; $root=(Get-Location).Path; $hostName=$env:COMPUTERNAME; if ($root -ne 'C:\sgSHIOK2026') { throw "Wrong root: $root" }; Write-Output "ROOT=$root"; Write-Output "HOST=$hostName"
```

Output:

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## head and remote

Command:

```powershell
git rev-parse HEAD
git ls-remote origin main
```

Output:

```text
dd006562873482969aa9d9a28a3530d061c77c7e
dd006562873482969aa9d9a28a3530d061c77c7e	refs/heads/main
```

## evidence path ignore check

Command:

```powershell
git check-ignore -v qa/verification/P723-analysis-report-preflight.md; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## preflight scan

Command:

```powershell
rg -n "DEFAULT_OUTPUT|--output|write_new_text_report|write_text|json\.dump|to_csv|to_json|FileExistsError|overwrite|main\(" "C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py" "C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py" "C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py" "C:\sgSHIOK2026\tests" -g "*.py"
```

Relevant output:

```text
C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py:22:from scripts.analysis.report_io import write_new_text_report
C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py:26:DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "P4-strand3-bus-saturation-analysis.txt"
C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py:528:    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py:532:def main() -> int:
C:\sgSHIOK2026\scripts\analysis\p4_bus_saturation_analysis.py:535:    write_new_text_report(args.output, report + "\n")
C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py:23:from scripts.analysis.report_io import write_new_text_report
C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py:27:DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "bus_fallback_blast_radius_20260812.txt"
C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py:448:    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py:452:def main() -> int:
C:\sgSHIOK2026\scripts\analysis\bus_fallback_blast_radius.py:455:    write_new_text_report(args.output, report + "\n")
C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py:25:from scripts.analysis.report_io import write_new_text_report
C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py:30:DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "verification" / "bus_zero_audit_20260812.txt"
C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py:350:        "--output",
C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py:358:def main() -> int:
C:\sgSHIOK2026\scripts\analysis\bus_zero_audit.py:362:    write_new_text_report(args.output, report)
```

## failed full-suite baseline before heat-audit repair

Command:

```powershell
uv run pytest -q
```

Output:

```text
================================== FAILURES ===================================
____________ test_heat_presentation_ui_audit_entries_still_resolve ____________

    def test_heat_presentation_ui_audit_entries_still_resolve() -> None:
        entries = analyze_heat_presentation.validate_ui_entries(
            analyze_heat_presentation.PROJECT_ROOT
        )
    
        assert entries
>       assert [entry for entry in entries if not entry["line_match"]] == []
E       AssertionError: assert [{'file': 'we...ndary.', ...}] == []
E         
E         Left contains one more item: {'file': 'web/app/layout.tsx', 'line': 6, 'string': 'Explore covered-walkway ratio, exposed gaps, night lighting evide... 'verdict': 'Acceptable: metadata leads with the shelter/exposure artifact and keeps the locked score secondary.', ...}
E         Use -v to get more diff

tests\test_heat_presentation_analysis.py:50: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve
1 failed, 506 passed in 456.47s (0:07:36)
```

Command:

```powershell
uv run python -c "from scripts.analysis import analyze_heat_presentation as a; import json; print(json.dumps([{'file':e['file'],'old_line':e['line'],'found_line':e['found_line'],'actual_line':e['actual_line'],'string':str(e['string'])} for e in a.validate_ui_entries(a.PROJECT_ROOT) if not e['expected_line_match']], indent=2))"
```

Output:

```text
[
  {
    "file": "web/app/page.tsx",
    "old_line": 1251,
    "found_line": 1280,
    "actual_line": ");",
    "string": "Heat proxy evidence: covered ${formatDistance(score.paths.covered_m)}; greenery proxy ${formatDistance(score.paths.shade_m)}."
  },
  {
    "file": "web/app/page.tsx",
    "old_line": 1343,
    "found_line": 1381,
    "actual_line": "}; ${longestGapText}`;",
    "string": "label: \"Shelter exposure\","
  },
  {
    "file": "web/app/page.tsx",
    "old_line": 1349,
    "found_line": 1387,
    "actual_line": "displayScore,",
    "string": "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence."
  },
  {
    "file": "web/app/page.tsx",
    "old_line": 1350,
    "found_line": 1388,
    "actual_line": "isCustomStopSelected,",
    "string": "Heat also includes the sparse NParks greenery proxy, so SHIOK shows covered-walkway ratio first."
  },
  {
    "file": "web/app/page.tsx",
    "old_line": 1513,
    "found_line": 1585,
    "actual_line": "onClick={copyFeedback}",
    "string": "<span>Four display rows; weights unchanged</span>"
  },
  {
    "file": "web/app/page.tsx",
    "old_line": 2207,
    "found_line": 2280,
    "actual_line": "const copyFeedback = async () => {",
    "string": "Heat proxy: shelter plus sparse NParks greenery, not measured temperature"
  }
]
```

## final verification

Command:

```powershell
uv run pytest tests/test_analysis_scripts.py tests/test_heat_presentation_analysis.py -q
```

Output:

```text
.......................                                                  [100%]
23 passed in 5.54s
```

Command:

```powershell
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
507 tests collected in 10.88s
```

Command:

```powershell
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

Command:

```powershell
git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

Output:

```text
```

Command:

```powershell
uv run pytest -q
```

Output:

```text
........................................................................ [ 14%]
........................................................................ [ 28%]
........................................................................ [ 42%]
........................................................................ [ 56%]
........................................................................ [ 71%]
........................................................................ [ 85%]
........................................................................ [ 99%]
...                                                                      [100%]
507 passed in 338.91s (0:05:38)
```

## diff stat

Command:

```powershell
git diff --stat
```

Output:

```text
 scripts/analysis/analyze_heat_presentation.py  | 16 +++++-----
 scripts/analysis/bus_fallback_blast_radius.py  |  3 +-
 scripts/analysis/bus_zero_audit.py             |  3 +-
 scripts/analysis/p4_bus_saturation_analysis.py |  3 +-
 scripts/analysis/report_io.py                  |  6 +++-
 tests/test_analysis_scripts.py                 | 44 ++++++++++++++++++++++++--
 tests/test_heat_presentation_analysis.py       |  6 ++--
 7 files changed, 64 insertions(+), 17 deletions(-)
```

## findings

1. Three historical bundle-analysis scripts refused overwrite only after reading/analyzing the bundle. The shared writer protected the file, but the CLIs failed late against already-existing report paths.
2. Full-suite testing exposed a stale heat-presentation audit table from the P18 UI copy change: the metadata string and six `web/app/page.tsx` line numbers no longer matched the current files.
3. The test count moved from 506 to 507 because this phase adds `test_historical_bus_reports_preflight_existing_output_before_analysis`.

## disagreements

1. None.
