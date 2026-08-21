# P491 P19 Sample Wording

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P491-p19-sample-wording.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_readme.py C:\sgSHIOK2026\tests\test_agent_docs.py C:\sgSHIOK2026\tests\test_production_readiness.py -q
...............................                                          [100%]
31 passed in 74.91s (0:01:14)
```

## Stale-Wording Search

```text
Command: rg -n "P19 sampled check|public-source check found a small sampled|16 Aug 2026 public-source check|The 16 Aug 2026 public-source check|The 16 Aug 2026 P19 sampled check" C:\sgSHIOK2026\README.md C:\sgSHIOK2026\CLAUDE.md C:\sgSHIOK2026\scripts\production_readiness.py; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Repository Integrity

```text
Command: python C:\sgSHIOK2026\scripts\check_repo_integrity.py; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
repo_integrity=ok
exit=0
```

## Protected Path Diff

```text
Command: git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. Browser copy already used `16 Aug 2026 public-source sample`, but README, `CLAUDE.md`, and production readiness still used `check` or `sampled check` in the headline P19 sentence.
2. The affected text kept the correct counts and denominator, so this was a boundary-wording issue rather than a data issue.

## DISAGREEMENTS

1. None.
