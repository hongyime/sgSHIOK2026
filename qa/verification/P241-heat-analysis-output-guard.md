# P241 heat analysis output guard

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Scope

P241 hardens `scripts/analysis/analyze_heat_presentation.py` so rerunning the
heat/rain presentation helper cannot overwrite the historical evidence file
`qa/verification/heat_presentation_investigation_20260812.json` by default.

No scoring, export, rescore, subset run, ingest, network build, deployment,
public-data mutation, or locked-weight change was run.

## Focused pytest

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_heat_presentation_analysis.py ....                            [100%]

============================== 4 passed in 1.26s ==============================
```

## UI audit guard

```text
entries=9
mismatches=0
expected_line_mismatches=0
```

## Script run to scratch output

```text
bundle=C:/sgSHIOK2026/web/public/data/generated_20260805_prefer_scored_routed
score_files=304
records=124443
scored_records=95157
scored_with_numeric_rain_heat=95157
rain_heat_equal_after_display_rounding=75834
rain_heat_equal_fraction=0.796936
rain_heat_raw_equal=73905
scored_with_shade_ratio=95157
scored_with_shade_ratio_exactly_zero=73891
shade_zero_fraction=0.776517
candidate_shade_ratio_exactly_zero=249885
ui_audit_entries=9
ui_audit_line_mismatches=0
wrote=C:\sgSHIOK2026\qa\p241\heat_presentation_investigation.json
```

## FINDINGS

1. The heat-presentation helper's previous default output path targeted the historical evidence file under `qa/verification/`, so a normal rerun could rewrite that file instead of appending a new correction.
2. The helper's fixed-line UI audit was stale after the product moved to the shelter-map presentation: before the fix, 21 of 21 entries failed to match current code lines.
3. The refreshed helper still reproduces the original heat/rain presentation signal: 75,834 of 95,157 scored records, 79.6936%, have equal displayed rain and heat values after rounding.

## DISAGREEMENTS

1. None.
