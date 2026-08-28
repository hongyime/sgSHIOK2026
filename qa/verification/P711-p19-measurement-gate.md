# P711 P19 measurement gate

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
8a84e2851b28545720bcd8e13a8a1af78b4a86a1
8a84e2851b28545720bcd8e13a8a1af78b4a86a1	refs/heads/main
```

## Focused tests

```text
..................                                                       [100%]
18 passed in 3.04s
```

## Diff stat

```text
 scripts/analysis/p19_universe_gap_measurement.py | 12 +++-
 tests/test_analysis_scripts.py                   | 89 ++++++++++++++++++++++++
 2 files changed, 98 insertions(+), 3 deletions(-)
```

## Collect-only

```text
492 tests collected in 7.94s
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
git check-ignore -v qa/verification/P711-p19-measurement-gate.md
exit=1
```

## FINDINGS

1. Direct `scripts.analysis.p19_universe_gap_measurement` invocation defaulted to the API/write measurement path unless `--cache-status-only` was supplied.
2. That was inconsistent with the safe `run.py p19-gap-status` wrapper and made accidental data.gov.sg, OneMap, and Overpass calls plus fixed `qa/p19` writes too easy.
3. Bare direct invocation now prints the cached status report and exits before loading the postal universe or calling APIs.
4. The API/write measurement path now requires explicit `--measure`.

## DISAGREEMENTS

1. None.
