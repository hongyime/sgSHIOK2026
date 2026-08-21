# P459 Dated P19 Source Policy

Root and host:

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

Scope:

```text
Updated structured batch-plan and production-readiness source policy only.
No scoring, export, rescore, subset run, ingest, network build, API call, deployment, public data write, or locked-weights change.
```

Focused tests:

```text
uv run pytest C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py -q -p no:cacheprovider
...................................                                      [100%]
35 passed in 187.71s (0:03:07)
```

Evidence path ignore check:

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P459-dated-p19-source-policy.md
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

1. Batch-plan and production-readiness structured source policy still used undated `P19 recent public-source gap sample` after the browser/docs/readiness prose had been dated.
2. The structured policy now records `measurement = P19 16 Aug 2026 public-source gap sample` and `generated_at_utc = 2026-08-16T02:08:55.624822+00:00`.
3. Focused batch-plan/readiness tests passed: `35 passed in 187.71s`.

DISAGREEMENTS:

1. None.
