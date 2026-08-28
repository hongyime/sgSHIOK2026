# P705 OneMap replay output guard

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
0fd4a60317b457b8d42087a5d6e9c5e41a6a01b1
0fd4a60317b457b8d42087a5d6e9c5e41a6a01b1	refs/heads/main
```

## Focused tests

```text
............                                                             [100%]
12 passed in 4.46s
```

## Diff stat

```text
 scripts/replay_onemap_outliers.py    |  6 ++++--
 tests/test_replay_onemap_outliers.py | 41 ++++++++++++++++++++++++++++++++++++
 2 files changed, 45 insertions(+), 2 deletions(-)
```

## Collect-only

```text
478 tests collected in 5.91s
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
git check-ignore -v qa/verification/P705-onemap-replay-output-guard.md
exit=1
```

## FINDINGS

1. `scripts/replay_onemap_outliers.py` required confirmation and an explicit `--output`, but still allowed that explicit output to overwrite an existing analysis report.
2. The overwrite guard now runs in `main()` before `replay_outliers()` can load scoring inputs, and the lower-level JSON writer now uses the shared non-overwrite report writer.
3. The regression test proves an existing output remains byte-for-byte unchanged and no replay/scoring call is made.

## DISAGREEMENTS

1. None.
