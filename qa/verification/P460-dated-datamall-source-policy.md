# P460 Dated DataMall Source Policy

Root and host:

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

Scope:

```text
Updated structured batch-plan and production-readiness source policy only.
No DataMall probe, payload download, manifest write, scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or locked-weights change.
```

Grounding scan:

```text
qa\verification\P264-datamall-discovery-only-command.md:36:uv run python run.py check --geospatial-discovery-only
qa\verification\P264-datamall-discovery-only-command.md:42:DataMall geospatial discovery check...
qa\verification\P264-datamall-discovery-only-command.md:50:DataMall geospatial discovery: matched 1, changed 2, errors 0
decisions.md:1203:The first-view Covered Linkway freshness caveat now carries the safe 21 Aug 2026 metadata-only DataMall discovery result: current shelter-layer discovery URLs differ from frozen v1, while no payload bytes were downloaded or compared. This distinction matters because the manifest-only freshness line truthfully says no upstream URLs were probed, but the separate discovery-only check is still a refresh signal. Frozen v1 remains untouched; any approved refresh must be a new numbered input version.
web\app\page.tsx:109:  "Covered Linkway follows a quarterly 120-day freshness threshold; frozen v1 uses the Mar 2026 LTA geospatial listing. A 21 Aug 2026 metadata-only DataMall check found current Covered Linkway and bridge/underpass discovery URLs differ from frozen v1, so any refresh must be a new numbered input version.";
```

Focused tests:

```text
uv run pytest C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py -q -p no:cacheprovider
...................................                                      [100%]
35 passed in 255.36s (0:04:15)
```

Evidence path ignore check:

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P460-dated-datamall-source-policy.md
EXIT=1
```

Repository integrity:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
EXIT=0
```

Protected path diff check:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases
EXIT=0
```

FINDINGS:

1. Browser copy already dated the safe metadata-only DataMall discovery drift as `21 Aug 2026`, but the shared batch-plan/readiness source-policy block only named `P262/P264 DataMall geospatial discovery-only probe`.
2. The structured policy now records `checked_at_local_date = 2026-08-21` while preserving the changed source list and no-payload/no-manifest-write boundary.
3. Focused batch-plan/readiness tests passed: `35 passed in 255.36s`.

DISAGREEMENTS:

1. None.
