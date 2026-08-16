# P24 No-Transit Partial Score Evidence

## Startup

```text
C:\sgSHIOK2026
PRAWN-E14
```

```text
fe886e9dc9a66148ffc8f99ef05ef3c6d4cfb03a
fe886e9dc9a66148ffc8f99ef05ef3c6d4cfb03a	refs/heads/main
```

## Scope

No scoring, export, rescore, subset run, ingest, or network build was run. This phase changes future scoring semantics and tests only.

Protected file check before evidence:

```text
git diff -- pipeline/config/weights.yaml
```

```text
```

## Inspection

`pipeline/scoring.py` short-circuited the whole composite when `transit_access` was `NO_TRANSIT_IN_RANGE`. `pipeline/scoring_integration.py` already filters for numeric candidate totals in `assemble_score_record()`: when no numeric candidate exists, the record remains `NO_TRANSIT_IN_RANGE`; when a numeric candidate has any null subscore, `public_route_option()` publishes `SCORED_PARTIAL`.

## Change

`calculate_composite_score()` now always returns the locked weighted sum. `NO_TRANSIT_IN_RANGE` and `NOT_YET_SCORED` contribute zero for their own terms. The weights are not renormalized.

The web partial-score note was generalized because partial records are no longer only direct-bus fallbacks with missing shelter evidence.

## Focused Test Output

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 74 items

tests\test_scoring.py ...........                                        [ 14%]
tests\test_scoring_integration.py ...................................... [ 66%]
.........................                                                [100%]

============================= 74 passed in 20.51s =============================
```

Initial web-test command used a Jest-only flag against Vitest and failed before running tests:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runTestsByPath lib/__tests__/accessibility-render.test.tsx
file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                ^

CACError: Unknown option `--runTestsByPath`
    at Command.checkUnknownOptions (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:406:17)
    at CAC.runMatchedCommand (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:606:13)
    at CAC.parse (file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/chunks/cac.DdICfEr1.js:547:12)
    at file:///C:/sgSHIOK2026/web/node_modules/vitest/dist/cli.js:11:13
    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v26.5.0
```

Correct Vitest file-filter run:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  11:05:06
   Duration  2.56s (transform 1.06s, setup 0ms, import 1.42s, tests 307ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx
```

## Final Verification

Full Python suite:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 346 items

tests\test_audit_current_bundle.py ....                                  [  1%]
tests\test_audited_shelter_corrections.py ..                             [  1%]
tests\test_batch_plan.py .......                                         [  3%]
tests\test_bus.py ...                                                    [  4%]
tests\test_bus_arrivals.py ...                                           [  5%]
tests\test_compare_targeted_scores.py ...........                        [  8%]
tests\test_connector_candidates.py ....                                  [  9%]
tests\test_diagnose_bus_connectors.py .........                          [ 12%]
tests\test_env.py ..                                                     [ 13%]
tests\test_export.py ..................................                  [ 22%]
tests\test_fetch.py .............                                        [ 26%]
tests\test_geocode_universe.py ...                                       [ 27%]
tests\test_hdb_void_deck_inference.py .............                      [ 31%]
tests\test_lamp_overlay.py ...                                           [ 32%]
tests\test_manifest_schema.py .                                          [ 32%]
tests\test_mayflower_qa_summary.py ....                                  [ 33%]
tests\test_network_preflight.py .....                                    [ 34%]
tests\test_network_qa.py .....                                           [ 36%]
tests\test_onemap_validation.py .........................                [ 43%]
tests\test_osm_tags.py ....                                              [ 44%]
tests\test_overture_addresses.py .....                                   [ 46%]
tests\test_partial_resnap_rescore.py ..                                  [ 46%]
tests\test_postal_universe.py ..........                                 [ 49%]
tests\test_production_readiness.py ................                      [ 54%]
tests\test_promote_audited_shelter_corrections.py ...                    [ 55%]
tests\test_publish.py ....                                               [ 56%]
tests\test_rebuild_network_debug.py ..                                   [ 56%]
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

======================= 346 passed in 344.93s (0:05:44) =======================
```

Full web suite:

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  22 passed (22)
      Tests  109 passed (109)
   Start at  11:06:57
   Duration  24.87s (transform 11.24s, setup 0ms, import 18.78s, tests 26.03s, environment 26ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

Repository integrity:

```text
repo_integrity=ok
exit=0
```

Diff and protected-file checks:

```text
diff_check_exit=0
weights_diff_exit=0
```

## FINDINGS

1. The composite short-circuit was narrower than the published state name implied: it only proved access was outside the zero-credit distance, but it discarded otherwise valid route shelter, heat, crossing, and bus evidence by making the candidate non-numeric.
2. The public schema already had the correct state for this repair. A routed candidate beyond the access range can be represented as `SCORED_PARTIAL` with `subscores.access = null` and a numeric locked-weight total.
3. Empty or rejected route situations remain protected: `assemble_score_record()` still emits `NO_TRANSIT_IN_RANGE` when no numeric candidate exists.

## DISAGREEMENTS

1. I would not publish this change by itself. It changes future score values for affected records and should be batched with the owner-approved bus/network repair rescore rather than shipped as a standalone scoring run.
