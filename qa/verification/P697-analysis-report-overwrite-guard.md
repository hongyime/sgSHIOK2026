# P697 analysis report overwrite guard

## Working root

```text
C:\sgSHIOK2026
```

## Change summary

```text
Added scripts.analysis.report_io.write_new_text_report and routed three historical analysis reports through it:
- scripts/analysis/bus_zero_audit.py
- scripts/analysis/bus_fallback_blast_radius.py
- scripts/analysis/p4_bus_saturation_analysis.py
```

## Direct overwrite probe

```text
scripts.analysis.bus_zero_audit: FileExistsError: refusing to overwrite existing analysis output: C:\sgSHIOK2026\qa\verification\bus_zero_audit_20260812.txt
scripts.analysis.bus_fallback_blast_radius: FileExistsError: refusing to overwrite existing analysis output: C:\sgSHIOK2026\qa\verification\bus_fallback_blast_radius_20260812.txt
scripts.analysis.p4_bus_saturation_analysis: FileExistsError: refusing to overwrite existing analysis output: C:\sgSHIOK2026\qa\verification\P4-strand3-bus-saturation-analysis.txt
exit=0
```

## Focused tests

```text
.............                                                            [100%]
13 passed in 8.42s
```

## Test collection

```text
465 tests collected in 23.65s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff hygiene

```text
exit=0
```

## Protected-path guard

```text
exit=0
```

## Evidence ignore check

```text
exit=1
```

## FINDINGS

1. Three historical analysis scripts defaulted to existing tracked files under `qa/verification/` and would overwrite them after completing their analysis. They now refuse to overwrite an existing output path.
2. The default report paths are preserved, so callers still see the historical output location, but reruns must opt into a new output path instead of silently replacing evidence.

## DISAGREEMENTS

1. None.
