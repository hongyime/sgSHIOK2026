# P463 Clicked Stop Preview Scope

Root and host:

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

Scope:

```text
Updated agent-facing documentation and test only.
No browser behavior change, OneMap call, scoring, export, rescore, subset run, ingest, network build, deployment, public data write, or locked-weights change.
```

Finding scan:

```text
CLAUDE.md:35:   `/api/onemap-route` for clicked-stop walk-preview evidence. Everything else is static
CLAUDE.md:99:- No turn-by-turn navigation, no live routing UI (walk display is shelter-map evidence only).
web\app\page.tsx:1805:  // Background fetch to snap arbitrary clicked stops onto real OneMap sidewalks for preview evidence.
```

Focused test:

```text
uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py -q -p no:cacheprovider
.                                                                        [100%]
1 passed in 1.29s
```

Evidence path ignore check:

```text
git check-ignore -v -- C:\sgSHIOK2026\qa\verification\P463-clicked-stop-preview-scope.md
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

1. `CLAUDE.md` simultaneously documented `/api/onemap-route` for clicked-stop walk-preview evidence and banned `live routing UI`.
2. The scope guard now permits clicked-stop OneMap walk previews as evidence only while still banning turn-by-turn navigation and locked-score mutation.
3. The agent-doc test now rejects the stale `no live routing UI` and `walk display is shelter-map evidence only` phrases.

DISAGREEMENTS:

1. None.
