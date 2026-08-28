# P707 audit output guards

## Working root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Root and remote check

```text
C:\sgSHIOK2026
f2fba49a0a89e374212d1d14f48f2c90145745c6
f2fba49a0a89e374212d1d14f48f2c90145745c6	refs/heads/main
```

## Focused tests

```text
...                                                                      [100%]
3 passed in 5.71s
```

## Diff stat

```text
 scripts/audit_connector_candidates.py | 28 ++++++++++++++++++++--------
 scripts/audit_postal_candidates.py    | 20 +++++++++++++++++---
 scripts/audit_route_feedback.py       | 28 ++++++++++++++++++++--------
 3 files changed, 57 insertions(+), 19 deletions(-)
```

## New test file status

```text
?? tests/test_audit_output_guards.py
```

## Collect-only

```text
483 tests collected in 7.09s
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
git check-ignore -v qa/verification/P707-audit-output-guards.md
exit=1
```

## FINDINGS

1. `scripts/audit_postal_candidates.py` required an explicit report path, but could overwrite it after running `score_postals`.
2. `scripts/audit_connector_candidates.py` could overwrite optional JSON, GeoJSON, and draft-correction outputs after loading protected network inputs.
3. `scripts/audit_route_feedback.py` could overwrite optional JSON, GeoJSON, and candidate GeoJSON outputs after loading protected network inputs.
4. All three CLIs now fail before their scoring or pipeline-input path when any requested output already exists, and all final text writes use the shared non-overwrite helper.

## DISAGREEMENTS

1. None.
