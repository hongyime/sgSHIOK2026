# P710 P379 probe output guard

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
0c9dcd3069133e25968abe711491cf1aa741ce47
0c9dcd3069133e25968abe711491cf1aa741ce47	refs/heads/main
```

## Focused tests

```text
................                                                         [100%]
16 passed in 3.39s
```

## Diff stat

```text
 scripts/analysis/p19_mcst_missing_locations.py |  42 ++++++++-
 tests/test_analysis_scripts.py                 | 115 ++++++++++++++++++++++++-
 2 files changed, 152 insertions(+), 5 deletions(-)
```

## Collect-only

```text
490 tests collected in 15.22s
```

## Repository integrity

```text
repo_integrity=ok
exit=0
```

## Diff checks

```text
git diff --check
exit=0
```

```text
protected paths diff
exit=0
```

## Evidence ignore check

```text
git check-ignore -v qa/verification/P710-p379-probe-output-guard.md
exit=1
```

## FINDINGS

1. `run.py p19-mcst-locations` was already read-only, but direct `scripts.analysis.p19_mcst_missing_locations --probe` still used fixed P379 cache/report paths by default.
2. That contradicted the script's own documented "new numbered P379 cache/report" intent and made accidental refresh of historical P379 evidence too easy.
3. Direct probe mode now requires explicit `--cache-output` and `--report-output`, refuses the historical default paths, and refuses overwriting an existing probe report before `build_report()` can call OneMap or write files.
4. Cache-output overwrite is still allowed for an explicitly named path because the probe cache is resumable; the report output is the durable summary and is non-overwriting.

## DISAGREEMENTS

1. None.
