# P2.1 Gap Register — 29,286 Unscored Postals in Frozen v1 Universe

**Report date:** 2026-09-18
**Scope:** Read-only categorization of WHY 29,286 of 124,443 frozen-v1 postal records lack a full locked `SCORED` state in the live published bundle `web/public/data/generated_20260805_prefer_scored_routed`.
**Author mode:** read-only analysis (PRODUCT-PLAN.md backlog item P2.1). No scoring, geocoding, export, publish, or write to protected paths performed.
**Owner ask being answered:** *"all need to be 100% bro"* — this report gives the categorical truth, not a promise.

---

## 1. Reconciliation of the 95,157 / 29,286 split

Source: `web/public/data/generated_20260805_prefer_scored_routed/manifest.json` → `provenance.state_counts`
(cross-checked against `uv run python run.py universe-status` output and `tmp/batch-plan-20260916.json`).

| Manifest state         | Count   | % of 124,443 | In README's "95,157 scored"? |
|------------------------|--------:|-------------:|:----------------------------:|
| `SCORED`               |  95,157 |       76.47% | Yes (this IS the 95,157)     |
| `SCORED_PARTIAL`       |  18,983 |       15.25% | **No — counts as gap**       |
| `NO_TRANSIT_IN_RANGE`  |   9,827 |        7.90% | **No — counts as gap**       |
| `NOT_YET_SCORED`       |     476 |        0.38% | **No — counts as gap**       |
| **Total universe**     | **124,443** | **100.00%** |                          |
| **Total gap (29,286)** |  29,286 |       23.53% | 29,286 = 18,983 + 9,827 + 476 |

Arithmetic check: `18,983 + 9,827 + 476 = 29,286` ✓ (exactly matches README's stated gap).
`95,157 + 29,286 = 124,443` ✓ (exactly matches frozen-v1 record count in `manifest.provenance.record_count`).

**All 29,286 unscored records fall into exactly three manifest states.** No hidden fourth cause exists in the published bundle.

---

## 2. Categorized gap breakdown (the register)

| # | Cause (manifest state)                          | Count  | % of 29,286 gap | Root reason                                                                                                                       |
|:-:|-------------------------------------------------|-------:|----------------:|-----------------------------------------------------------------------------------------------------------------------------------|
| A | `SCORED_PARTIAL` — locked-weight zero-contribution on ≥1 subscore | 18,983 |          64.82% | Route evidence exists and at least one subscore is numeric, but one or more of {access, bus, crossing, heat, rain} has no evidence at this postal's location; locked weights count the missing term as zero (per decisions.md §148, §921). |
| B | `NO_TRANSIT_IN_RANGE` — no qualifying MRT/LRT exit or bus stop within locked 1.2 km transit range |  9,827 |          33.55% | Every transit-candidate path is disconnected, no numeric candidate was selected, or every numeric route was rejected by trust gates (decisions.md §148, §924, §990, §993, §1634). |
| C | `NOT_YET_SCORED` — postal in frozen-v1 address list but no full locked score published for it | 476 | 1.62% | 100% of these are `OneMap search API → NOT_FOUND` postals from the completed bounded-geocode fill (`universe-status.bounded_geocoding.status_counts.NOT_FOUND = 476`). Address exists in the June 2020 OneMap-derived dump but does not resolve to coordinates via current OneMap search (decisions.md §918, §2253, §2261, §2277). |
|   | **Total**                                       | **29,286** | **100.00%** |                                                                                                                                   |

**Cause A sub-context.** `SCORED_PARTIAL` is not one homogenous population. Under the locked weight vector (`weights.yaml` fingerprint `5c62ac5f…`) any of the five component evidences (access / bus / crossing / heat / rain) can be missing independently, and the manifest does not shard partials by which term is missing. Cause A therefore aggregates every combination of one-to-four missing terms.

**Cause B sub-context.** decisions.md §1634 explicitly says `NO_TRANSIT_IN_RANGE` covers three different route-evidence failure shapes (far-connected-walk beyond 1.2 km, disconnected-candidate, no-candidate); the manifest state count does not split these three.

**Cause C sub-context.** The universe-status probe records `bounded_geocoding.completed_fill.status_counts = {NOT_FOUND: 476, SUCCESS: 99}` — the bounded fill already ran and closed 99 postals; the remaining 476 are the ones OneMap search itself refuses to locate. This is a hard geocoding boundary against the current OneMap corpus, not a scoring boundary.

---

## 3. Effect of the currently-running rescore on each category

**Rescore identification (confirmed via `Get-Process` + `Get-CimInstance Win32_Process`):**
- **PID 72436**, started 2026-09-18 06:52:18 (Stage-2 start per `rescore.log`; overall run began 2026-09-17 23:25:44 during Stage 1).
- Command line: `python -B -m pipeline.score_batch --postal-universe processed\postal_universe_candidate_full_registered_geocoded.parquet --network processed\network_island.parquet --output-dir C:\sgSHIOK2026\processed\score_batches\full_rescore_20260917_232544 --full-batch --confirm-full-batch`.
- Approved bundled changes: **bus remodel** + **network conflation repair** (decisions.md P576). Explicitly **not** included: postal-universe v2 promotion, geocoding refresh, `NO_TRANSIT_IN_RANGE` partial-score presentation-state fix (all still gated per `universe-status.full_batch_change_readiness`).

| Category           | Will this rescore shrink it? | Why                                                                                                                                                                                    |
|--------------------|:---------------------------:|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A `SCORED_PARTIAL` (18,983) | **Partially, yes**   | Bus remodel can supply a numeric `bus` subscore where none was findable before; network conflation repair can supply access/crossing/rain by connecting previously-orphaned edges. Any partial whose missing terms are among these becomes `SCORED`. Partials whose missing terms are `heat` (shade-proxy geometry gap) or component evidences unrelated to bus/network stay `SCORED_PARTIAL` — the rescore does not fabricate absent geometry. |
| B `NO_TRANSIT_IN_RANGE` (9,827) | **Partially, yes** | Network conflation repair (77 residual OSM components > 50 nodes, `island_network_qa.final_residual_components_gt_50`) plus bus remodel can rescue postals that were disconnected purely by graph defects. Postals whose *nearest* real MRT exit / bus stop is genuinely > 1.2 km on the ground **cannot** move — the 1.2 km ceiling is a locked-policy release constraint, not a bug. |
| C `NOT_YET_SCORED` (476)   | **No, zero movement** | This rescore runs on the *already-geocoded* input parquet `postal_universe_candidate_full_registered_geocoded.parquet`. The 476 rows are the ones for which OneMap search returned `NOT_FOUND` in the bounded fill; scoring cannot produce a location where the geocoder produced none. Closing these requires a *separate* postal-universe v2 promotion (candidate-source-first + bounded OneMap validation), which is **not owner-approved** and is **not** part of the running batch. |

**No prediction of exact post-rescore counts is made here** — that requires reading the rescore's own output at `processed\score_batches\full_rescore_20260917_232544\`, which is currently locked by PID 72436 and is off-limits per the task guardrails.

---

## 4. Structural vs. fixable classification

| Category | Sub-population | Structurally un-fixable under locked policy? | Fixable by already-approved work? | Fixable only by NOT-YET-approved work? |
|----------|----------------|:--:|:--:|:--:|
| A `SCORED_PARTIAL` — missing term is `bus` | subset of 18,983 |  | **Yes** — running bus remodel (P576) |  |
| A `SCORED_PARTIAL` — missing term is `access`/`crossing`/`rain` due to graph defect | subset of 18,983 |  | **Yes** — running network conflation repair (P576) |  |
| A `SCORED_PARTIAL` — missing term is `heat` (no covered_linkway / no nparks shade proxy geometry at this location) | residual subset of 18,983 | **Yes** (until a new shade-proxy source is ingested; heat is currently `provisional_covered_plus_nparks_shade_proxy_heat_only` per manifest) |  | Would require a new shade-proxy source + owner approval |
| A `SCORED_PARTIAL` — missing term is `crossing` because grade-separated exemption legitimately eliminated the candidate | residual subset of 18,983 | **Yes** — this is the *correct* locked behaviour, not a defect |  |  |
| B `NO_TRANSIT_IN_RANGE` — caused by graph disconnection / island / conflation defect | subset of 9,827 |  | **Yes** — running network conflation repair (P576) |  |
| B `NO_TRANSIT_IN_RANGE` — genuinely > 1.2 km from any real MRT exit or bus stop | residual subset of 9,827 | **Yes** — the 1.2 km locked transit range is a release policy, not a bug (decisions.md §990/§993) |  | Would require an owner-approved policy change to the locked range |
| C `NOT_YET_SCORED` — OneMap `NOT_FOUND` (all 476) | all of 476 | **No, but not fixable inside frozen v1** |  | **Yes** — requires postal-universe v2 promotion (candidate-source-first, bounded OneMap validation, owner approval). See `full_batch_change_readiness` → status `not_approved_from_current_sample`. |

**Important second-order note.** Even if postal-universe v2 is later approved, decisions.md's stale P19 sample (age 20.4 days vs. 7-day freshness threshold, per `batch-plan-20260916.json`) means the true "unresolvable address" count in v2 is unknown today; the directional-only estimate is ~765 confirmed missing rows + ~1,020 warning-quality rows at *v1*'s scale, which suggests v2 will change the *composition* of Cause C but will not necessarily drive it to zero — new completions (SUN PLAZA SPRING, YISHUN BEACON, CANAAN, MYRA per the P19 v2 cache sample) will keep arriving.

---

## 5. Can this ever reach 100%? — honest answer

**No, not under the locked policy that is currently in force. And that is by design, not by defect.**

Here is the direct decomposition:

1. **Cause C (476 records, 1.62% of gap, 0.38% of universe)** can be *reduced* — probably substantially — by an owner-approved postal-universe v2 promotion plus a fresh bounded OneMap validation pass, but the residual will almost never be exactly zero because (a) new developments finish and register faster than any snapshot, and (b) some addresses in the frozen-v1 dump were captured from a 2020 corpus where OneMap itself no longer resolves the string. This category is *shrinkable*, not *closable*, and the currently-running rescore does not touch it at all.

2. **Cause B (9,827 records, 33.55% of gap)** contains two very different sub-populations:
   - A *repair-eligible* subset (postals disconnected only because the graph has real conflation defects — `island_network_qa` still reports 2,752 connected components and 77 residual OSM components > 50 nodes). The running network-conflation-repair rescore will move an unknown-but-non-trivial fraction of these into `SCORED` / `SCORED_PARTIAL`.
   - A *structurally un-fixable* subset — postals whose nearest real MRT exit or bus stop is genuinely more than 1.2 km away by street-network distance. The 1.2 km ceiling is a **locked release policy** (decisions.md §990, §993). Under that policy, these records *must* remain `NO_TRANSIT_IN_RANGE`. They cannot be moved to `SCORED` without either (a) an owner-approved policy change to the locked transit range, or (b) faking a score, which is explicitly forbidden by decisions.md's "missing stays missing" rule.

3. **Cause A (18,983 records, 64.82% of gap — by far the largest bucket)** is the most misleading category if read as "unscored". These records **do** have real route evidence and at least one numeric subscore. They are labelled `SCORED_PARTIAL` precisely because one or more of the five component evidences (access / bus / crossing / heat / rain) genuinely does not exist at that location, and locked weights count the missing term as zero rather than renormalizing to a fake full score. Bus remodel + network conflation repair will convert a fraction of these — those whose only missing term is `bus` or a graph-defect-caused access/crossing/rain — into `SCORED`. But partials whose missing term is `heat` (residual shade-proxy geometry gap) or `crossing` under a legitimate grade-separated exemption **should stay `SCORED_PARTIAL`** — that is the correct behaviour, not a coverage failure.

**Bottom line for the owner.**

- The single running rescore (PID 72436) will materially shrink Cause A and Cause B, but not to zero, and will not touch Cause C at all.
- Closing Cause C further requires a *separate* not-yet-approved change (postal-universe v2), which itself will leave a residual.
- A hard floor exists under Cause A and Cause B that **cannot be crossed without violating the locked "missing stays missing, never faked" policy** (decisions.md P17/P46/P546 + §148).
- Therefore **100.00% locked-`SCORED` coverage of the frozen-v1 124,443 universe is not achievable** under current policy. What *is* achievable, in order of expected impact:
  1. Post-rescore export (already approved, already running): Cause A and Cause B shrink; Cause C untouched.
  2. Approved postal-universe v2 promotion (not approved yet): Cause C shrinks; Cause A and Cause B unaffected.
  3. Owner-approved policy change (e.g. adjusting the 1.2 km locked transit range, or introducing a new `SCORED_FOUR_OF_FIVE` display state per §762): would move the ceiling, but is a policy decision, not an engineering deliverable.

The 76.47% currently-`SCORED` share is the honest floor for the June 2020 frozen-v1 universe under the locked policy on 2026-09-18. The rescore's completion + a hypothetical v2 promotion could push that meaningfully higher, but a headline "100%" would only ever mean *"we changed what the label means"*, not that every real postal now has real evidence in every component.

---

## 6. Sources consulted (all read-only)

- `web/public/data/generated_20260805_prefer_scored_routed/manifest.json` — canonical `state_counts` used for the register.
- `uv run python run.py universe-status` — confirmed bounded-geocode `NOT_FOUND = 476`, network QA metrics (2,752 components, 77 residuals > 50), `full_batch_change_readiness` for each bundled change.
- `tmp/batch-plan-20260916.json` — verified as fresh enough for gap-sizing framing (2026-09-17 07:06 modification time, 1 day old vs. today 2026-09-18); reused instead of re-running `run.py batch-plan`.
- `decisions.md` — §148, §349, §531, §537, §720, §762, §918, §921, §924, §990, §993, §1634, §1657, §2253, §2261, §2277, §2659, §3000, plus P17 / P46 / P546 / P576 policy anchors.
- `Get-Process` + `Get-CimInstance Win32_Process -Filter "ProcessId=72436"` — confirmed live rescore, its command line, and target output directory. No file under `processed\network_island.parquet` or `processed\score_batches\full_rescore_20260917_232544\` was opened.
- `qa/revamp-r1/full-rescore-20260917/rescore.log` — read tail-5 only, to confirm the rescore is in Stage 2 and to reconcile the PID with the 2026-09-17 23:25:44 start referenced in the task.

**Not consulted / not run** (per guardrails): `run.py score`, `score-batch`, `network`, `export`, `export-transit`, `ingest`, `geocode-universe`, `postal-universe`, `publish`. `run.py readiness --gate-summary` was attempted but timed out at 180 s and was not retried because `universe-status` already carried the same gate information (`checkpoint_gates`, `full_batch_change_readiness`, `full_batch_release_scope`).
