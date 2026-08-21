# P445 P19 Cluster Docs

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Date: 2026-08-21

## Scope

Free-tier documentation and test update only. No scoring, export, rescore, subset run, ingest, network build, deployment, or protected data mutation.

## Evidence

P444 made the P19 confirmed HDB missing-address cluster names machine-readable in `pipeline/batch_plan.py` and readiness output. P445 carries those same names into human-facing README and agent docs so operators do not need to inspect JSON to know which developments are confirmed gaps.

Confirmed HDB clusters now named in docs:
- SUN PLAZA SPRING, three postals
- YISHUN BEACON, three postals

Unvalidated MCST proxy warnings remain separated:
- CANAAN
- MYRA

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=798c2d097b8da3e451ffd9f7f2b6def9452dd84d
ORIGIN_MAIN=798c2d097b8da3e451ffd9f7f2b6def9452dd84d	refs/heads/main
```

```text
> git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P445-p19-cluster-docs.md; echo EXIT=$LASTEXITCODE
EXIT=1
```

```text
> uv run pytest tests/test_readme.py tests/test_agent_docs.py -q -p no:cacheprovider
.....                                                                    [100%]
5 passed in 1.52s
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; echo EXIT=$LASTEXITCODE
repo_integrity=ok
EXIT=0
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases; echo EXIT=$LASTEXITCODE
EXIT=0
```

## Findings

1. The public docs exposed the P19 evidence split count but not the confirmed HDB cluster names; the names were only visible in structured batch-plan/readiness policy after P444.

## Disagreements

1. None.
