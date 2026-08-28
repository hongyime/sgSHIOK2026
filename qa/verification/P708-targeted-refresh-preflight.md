# P708 targeted refresh preflight

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
032cf5a3b40a6ece52421a3d38f4cb84ece8428b
032cf5a3b40a6ece52421a3d38f4cb84ece8428b	refs/heads/main
```

## Focused tests

```text
..............                                                           [100%]
14 passed in 2.45s
```

## Diff stat

```text
 scripts/targeted_bundle_refresh.py    | 22 +++++++++++++----
 tests/test_targeted_bundle_refresh.py | 45 +++++++++++++++++++++++++++++++++++
 2 files changed, 63 insertions(+), 4 deletions(-)
```

## Collect-only

```text
485 tests collected in 5.70s
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
git check-ignore -v qa/verification/P708-targeted-refresh-preflight.md
exit=1
```

## FINDINGS

1. `scripts/targeted_bundle_refresh.py` refused an existing target bundle inside `refresh_bundle`, but only after confirmation, source-bundle resolution, and selected-postal input reads.
2. The targeted-refresh report output path could overwrite an existing report after the refresh work completed.
3. The CLI now checks the target bundle directory and report output before active bundle lookup, postal input reads, bundle copying, or scoring.
4. The report write now uses `write_new_text_report`; internal bundle JSON helpers remain unchanged because they intentionally rewrite files inside the newly copied target bundle.

## DISAGREEMENTS

1. None.
