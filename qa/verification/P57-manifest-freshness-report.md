# P57 Manifest Freshness Report Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P57 adds a manifest-only source freshness report path: `pipeline.fetch check --freshness-only`.
It reads raw/manifest.json and pipeline/config/sources.yaml, prints freshness status, and does not probe upstream URLs, ingest, export, score, rescore, rebuild inputs, deploy, write public data, or touch locked weights.
```

## Source Scan

```text
C:\sgSHIOK2026\run.py:20:    "check": "fetch listings, hash, diff vs manifest; use --freshness-only for manifest-only staleness report",
C:\sgSHIOK2026\qa\verification\P57-manifest-freshness-report.md:14:P57 adds a manifest-only source freshness report path: `pipeline.fetch check --freshness-only`.
C:\sgSHIOK2026\qa\verification\P57-manifest-freshness-report.md:20:1. Source freshness policy existed in config and `run_check`, but the only user-facing check path also performed upstream probes and hash comparisons. That made a cheap stale-source report harder to run safely during evidence-preservation work.
C:\sgSHIOK2026\pipeline\fetch.py:287:def run_freshness_report(
C:\sgSHIOK2026\pipeline\fetch.py:292:    """Report manifest-only source freshness without probing upstream URLs."""
C:\sgSHIOK2026\pipeline\fetch.py:304:    print("Source freshness from raw/manifest.json...")
C:\sgSHIOK2026\pipeline\fetch.py:1168:        "--freshness-only",
C:\sgSHIOK2026\pipeline\fetch.py:1187:        return run_freshness_report(sources)
C:\sgSHIOK2026\pipeline\fetch.py:1192:            print("--freshness-only is only valid with check", file=sys.stderr)
C:\sgSHIOK2026\tests\test_fetch.py:150:def test_run_freshness_report_does_not_probe_upstream(
C:\sgSHIOK2026\tests\test_fetch.py:177:        fetch.run_freshness_report(
C:\sgSHIOK2026\tests\test_fetch.py:191:    assert "Source freshness from raw/manifest.json..." in out
```

## Focused Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 14 items

tests\test_fetch.py ..............                                       [100%]

============================= 14 passed in 7.79s ==============================
EXIT_CODE=0
```

## Manifest-Only Module Command

```text
Source freshness from raw/manifest.json...
[lamp_posts] Lamp Posts: freshness current (quarterly)
Freshness: current 1, stale 0, manual 0, unknown_policy 0, unknown_age 0
EXIT_CODE=0
```

## Relevant Python Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 15 items

tests\test_fetch.py ..............                                       [ 93%]
tests\test_run.py .                                                      [100%]

============================= 15 passed in 3.37s ==============================
EXIT_CODE=0
```

## Full Python Tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 347 items

tests\test_audit_current_bundle.py ....                                  [  1%]
tests\test_audited_shelter_corrections.py ..                             [  1%]
tests\test_batch_plan.py .......                                         [  3%]
tests\test_bus.py ...                                                    [  4%]
tests\test_bus_arrivals.py ...                                           [  5%]
tests\test_compare_targeted_scores.py ...........                        [  8%]
tests\test_connector_candidates.py ....                                  [  9%]
tests\test_diagnose_bus_connectors.py .........                          [ 12%]
tests\test_env.py ..                                                     [ 12%]
tests\test_export.py ..........................                          [ 22%]
tests\test_fetch.py ..............                                       [ 26%]
tests\test_geocode_universe.py ...                                       [ 27%]
tests\test_hdb_void_deck_inference.py .............                      [ 31%]
tests\test_lamp_overlay.py ...                                           [ 32%]
tests\test_manifest_schema.py .                                          [ 32%]
tests\test_mayflower_qa_summary.py ....                                  [ 33%]
tests\test_network_preflight.py .....                                    [ 35%]
tests\test_network_qa.py .....                                           [ 36%]
tests\test_onemap_validation.py .........................                [ 43%]
tests\test_osm_tags.py ....                                              [ 44%]
tests\test_overture_addresses.py .....                                   [ 46%]
tests\test_partial_resnap_rescore.py ..                                  [ 46%]
tests\test_postal_universe.py ..........                                 [ 49%]
tests\test_production_readiness.py ................                      [ 54%]
tests\test_promote_audited_shelter_corrections.py ...                    [ 55%]
tests\test_publish.py ....                                               [ 56%]
tests\test_rebuild_network_debug.py ..                                   [ 57%]
tests\test_replay_onemap_outliers.py .........                           [ 59%]
tests\test_repo_integrity.py ......                                      [ 61%]
tests\test_route_feedback.py .....                                       [ 62%]
tests\test_routing.py ........                                           [ 65%]
tests\test_run.py .                                                      [ 65%]
tests\test_score_batch.py .......                                        [ 67%]
tests\test_scoring.py ...........                                        [ 70%]
tests\test_scoring_integration.py ...................................... [ 81%]
.........................                                                [ 88%]
tests\test_shade.py ......                                               [ 90%]
tests\test_shelter_skeleton.py ..                                        [ 91%]
tests\test_stub.py .                                                     [ 91%]
tests\test_targeted_bundle_refresh.py .........                          [ 93%]
tests\test_triage_onemap_outliers.py .....................               [100%]

======================= 347 passed in 174.62s (0:02:54) =======================
EXIT_CODE=0
```

## Run.py Entry Point

```text
Source freshness from raw/manifest.json...
[lamp_posts] Lamp Posts: freshness current (quarterly)
Freshness: current 1, stale 0, manual 0, unknown_policy 0, unknown_age 0
EXIT_CODE=0
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Diff Check

```text
DIFF_CHECK_EXIT=0
```

## Weights Diff

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. Source freshness policy existed in config and `run_check`, but the only user-facing check path also performed upstream probes and hash comparisons. That made a cheap stale-source report harder to run safely during evidence-preservation work.

## Disagreements

1. None.
