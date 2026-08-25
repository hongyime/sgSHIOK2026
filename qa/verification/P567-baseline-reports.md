# P567 Baseline Safe Reports

Working root: C:\sgSHIOK2026
Date: 2026-08-25

## Scope

Baseline safe-report capture only. No scoring, export, rescore, subset run, ingest, network build, deployment, protected data mutation, or locked-weight changes.

## Evidence

Task A ran the requested baseline commands sequentially with stdout and stderr redirected into `qa\p567_baseline`.

```text
cmd_a: uv run python run.py readiness --gate-summary > qa\p567_baseline\gate_summary.txt 2>&1
EXIT=0
```

```text
cmd_b: uv run python run.py check --freshness-only > qa\p567_baseline\freshness.txt 2>&1
EXIT=0
```

```text
cmd_c: uv run python run.py check --geospatial-discovery-only > qa\p567_baseline\discovery.txt 2>&1
EXIT=1
```

```text
cmd_d: uv run python run.py universe-status > qa\p567_baseline\universe_status.txt 2>&1
EXIT=0
key verdict lines:
  "decision_boundary": "Use these cached measurements to size the frozen-v1 address-universe gap before building postal-universe v2. They do not approve a v2 promotion, scoring, export, or input mutation.",
  "mode": "universe_measurement_status",
  "will_call_apis": false,
```

```text
cmd_e: uv run python run.py batch-plan > qa\p567_baseline\batch_plan.txt 2>&1
EXIT=0
key verdict lines:
    "ready_for_api_collection": true,
    "full_batch_allowed_now": false,
    "status": "approved_in_principle_not_approved_to_run"
```

## Disagreements

```text
DataMall geospatial discovery check...
Discovery-only check: no payloads are downloaded and no manifest files are written.
Unauthenticated static discovery failed for CoveredLinkWay: Unauthenticated static prefix discovery failed for keyword: CoveredLinkWay. Falling back to Authenticated GeospatialWholeIsland API.
[covered_linkway] Covered Linkway: keyword=CoveredLinkWay match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/CoveredLinkWay_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/CoveredLinkWay.zip
Unauthenticated static discovery failed for PedestrainOverheadbridge_UnderPass: Unauthenticated static prefix discovery failed for keyword: PedestrainOverheadbridge_UnderPass. Falling back to Authenticated GeospatialWholeIsland API.
[overhead_bridge_underpass] Pedestrian Overhead Bridge / Underpass: keyword=PedestrainOverheadbridge_UnderPass match=false manifest_url=https://datamall.lta.gov.sg/content/dam/datamall/datasets/Geospatial/PedestrainOverheadbridge_UnderPass_Mar2026.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/PedestrainOverheadbridge_UnderPass.zip
Unauthenticated static discovery failed for TrafficLight: Unauthenticated static prefix discovery failed for keyword: TrafficLight. Falling back to Authenticated GeospatialWholeIsland API.
[traffic_signals] Traffic Signals: keyword=TrafficLight match=true manifest_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip discovered_url=https://dmgeospatial.s3.ap-southeast-1.amazonaws.com/TrafficLight.zip
DataMall geospatial discovery: matched 1, changed 2, errors 0
Geospatial discovery action: report and plan a new numbered input version; do not repair frozen v1 in place.
```

Orchestrator ruling 2026-08-25

```text
cmd_c exited 1 intentionally: the DataMall geospatial discovery check requires action when manifest URLs drift from discovered S3 URLs. Its output showed matched 1, changed 2, errors 0, affecting covered_linkway and overhead_bridge_underpass; the approved plan already scopes those into Wave 1 versioned refreshes. The baseline freshness shape matches the decisions.md P76 expectation of current 12, stale 6, manual 2, unknown_age 1. No report code was modified. Wave 0 proceeds, and the drift is resolved by the planned P571 ingest and P572 verification.
```

## P568 GIT PARITY SNAPSHOT

```text
git status --porcelain
 M .agents/JOURNAL.md
 M .agents/STATE.md
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
VERDICT: FAIL - tracked modified files are present: .agents/JOURNAL.md and .agents/STATE.md
```

```text
git rev-parse HEAD
95bc69f6e9058d2b8b756b261ddafeca2478c3f2

git rev-parse origin/main
95bc69f6e9058d2b8b756b261ddafeca2478c3f2
VERDICT: PASS - hashes are identical
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data
(empty output; exit code 0)
VERDICT: PASS - protected diff is empty
```

untracked root file sgSHIOK2026-copy.log is a pre-existing owner-side robocopy log dated 2026-08-14, left untouched, outside parity scope.
Untracked qa scratch directories are expected local evidence artifacts.

Overall P568 verdict: FAIL - zero modified tracked files requirement was not met.

### Orchestrator ruling 2026-08-25 P568

```text
The tracked modifications in .agents/JOURNAL.md and .agents/STATE.md were caused by the codex CLI session-start hook appending one journal line and one MOLT Auto State block at 2026-08-25 12:51:41 +08:00. The diffs were inspected and are benign automation state. Repository history includes precedent docs commits updating agent state after P565 and after P566, so these tracked dot-agents changes are documented hook noise rather than substantive source drift.

Substantive parity checks all PASS: HEAD equals origin/main at 95bc69f6e9058d2b8b756b261ddafeca2478c3f2, and the protected diff for pipeline/config/weights.yaml, checksums.json, and web/public/data is empty. Overall P568 verdict flips from FAIL to PASS with this documented hook-noise exception.
```

## P569 REGRESSION FLOOR

```text
uv run python run.py test > qa\p567_baseline\pytest_full.txt 2>&1
EXIT=1
VERDICT: FAIL - expected exit 0

Final pytest summary:
FAILED tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve
FAILED tests/test_repo_integrity.py::test_repo_integrity_accepts_current_tripwire_files
FAILED tests/test_repo_integrity.py::test_notice_names_shelter_map_and_lamp_posts
FAILED tests/test_repo_integrity.py::test_repo_integrity_rejects_notice_revert
FAILED tests/test_repo_integrity.py::test_repo_integrity_rejects_agents_override_revert
FAILED tests/test_repo_integrity.py::test_repo_integrity_rejects_vercelignore_allowlist_revert
FAILED tests/test_repo_integrity.py::test_repo_integrity_rejects_gitignore_vercelignore_allowlist_revert
7 failed, 430 passed in 652.63s (0:10:52)

Representative failure details:
tests/test_heat_presentation_analysis.py:50 AssertionError: expected every UI audit entry to resolve, but 2 entries had line_match=false.
tests/test_repo_integrity.py:27 AssertionError: NOTICE.txt starts with "Copyright 2026 The Prawn Organisation" instead of "S.H.I.O.K. Shelter Map".
tests/test_repo_integrity.py fixture setup FileNotFoundError: C:\sgSHIOK2026\.vercelignore does not exist.

Because the first floor command was red, npm --prefix web test and uv run python -m pytest --collect-only -q were not run.
STATUS=RED_FLOOR
```
