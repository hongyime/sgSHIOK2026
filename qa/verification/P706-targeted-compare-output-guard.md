# P706 targeted compare output guard

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
8eaaf7db8403a1070f75192b3620fe74a73746fd
8eaaf7db8403a1070f75192b3620fe74a73746fd	refs/heads/main
```

## Focused tests

```text
..............                                                           [100%]
14 passed in 2.12s
```

## Diff stat

```text
 scripts/compare_targeted_scores.py    | 25 +++++++++----
 tests/test_compare_targeted_scores.py | 66 +++++++++++++++++++++++++++++++++++
 2 files changed, 85 insertions(+), 6 deletions(-)
```

## Collect-only

```text
480 tests collected in 6.39s
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
git check-ignore -v qa/verification/P706-targeted-compare-output-guard.md
exit=1
```

## FINDINGS

1. `scripts/compare_targeted_scores.py` required an explicit comparison report path, but that path and the optional safe-postals text path could overwrite existing analysis outputs.
2. The compare CLI now rejects existing output paths before resolving or loading the published shelter-map bundle.
3. Both final writes now go through the shared non-overwrite report writer, so direct write helpers and CLI use the same refusal behavior.

## DISAGREEMENTS

1. None.
