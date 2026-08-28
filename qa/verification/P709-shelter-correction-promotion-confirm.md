# P709 shelter correction promotion confirmation

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
142ef5c8c9b64be52398ece11584d0d997803690
142ef5c8c9b64be52398ece11584d0d997803690	refs/heads/main
```

## Focused tests

```text
.....                                                                    [100%]
5 passed in 1.69s
```

## Diff stat

```text
 scripts/promote_audited_shelter_corrections.py    | 20 +++++
 tests/test_promote_audited_shelter_corrections.py | 93 ++++++++++++++++++++++-
 2 files changed, 112 insertions(+), 1 deletion(-)
```

## Collect-only

```text
487 tests collected in 11.67s
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
git check-ignore -v qa/verification/P709-shelter-correction-promotion-confirm.md
exit=1
```

## FINDINGS

1. `scripts/promote_audited_shelter_corrections.py` could perform a non-dry-run promotion into the persistent approved correction layer without a separate CLI confirmation flag.
2. The CLI now requires `--confirm-promotion` unless `--dry-run` is used.
3. The confirmation guard runs before `promote_corrections()` can read draft GeoJSON or write the target layer.

## DISAGREEMENTS

1. None.
