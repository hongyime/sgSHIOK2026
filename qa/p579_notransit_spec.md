# P579 Spec — NO_TRANSIT_IN_RANGE Partial-Score Semantics (Existing Fields Only)

Working root: C:\sgSHIOK2026
Date: 2026-08-26
Status: SPECIFIED — no schema change required

## Scope

Defines what a `state: "NO_TRANSIT_IN_RANGE"` record may carry per disconnection shape, constraining implementation (P580) to EXISTING published-schema fields. Copy rules remain governed by P110/P111; this spec changes data population, not wording.

## Observed ground truth (subset run fresh_20260826)

Real NO_TRANSIT record `059804` serializes today as:

```text
top keys : [best_node, data_as_of, exposure_gaps, paths, postal, provenance, state, subscores, total]
state    : NO_TRANSIT_IN_RANGE   total: None
subscores: None   best_node: None   paths: None
route_options: {} (empty dict)     candidates: absent
```

Scored records expose the full field inventory this spec maps into:

```text
paths (17): bus_stop_access_connector_m, covered_m, covered_ratio, destination_snap_connector_m,
            detour_pct, endpoint_snap_connector_m, heat_comfort_m, heat_comfort_ratio,
            mrt_lrt_exit_access_connector_m, origin_snap_connector_m, routing_type, shade_m,
            shade_ratio, sheltered_m, shortest_covered_ratio, shortest_m, shortest_shade_ratio
route_options entries (per type): {state, total, subscores, best_node, paths, exposure_gaps}
record: {postal, state, total, subscores, best_node, paths, exposure_gaps, route_options,
         candidates, data_as_of, provenance}
```

## Assembly mechanics pinned (scoring_integration.assemble_score_record)

Whole-record NO_TRANSIT branch fires **only when zero candidates produced numeric totals** (disconnected origin component, or no candidate within search radius). Any record with at least one routable candidate flows the scored path, where out-of-policy-cap candidates still yield numeric composites (fixture: 1300 m MRT -> access=None, state SCORED_PARTIAL, total 35.8).

## Shape definitions and field mapping

### Shape A — far-connected (origin routable; nearest eligible transit beyond policy caps; route computable)

Today such records can still fall into the all-null NO_TRANSIT branch when caps filter every candidate out of `scored_candidates`. Spec: retain the out-of-cap best candidate's **shelter-map evidence** in existing fields; comfort scoring and total stay suppressed.

| Field | Value | Existing? |
|---|---|---|
| `state` | `"NO_TRANSIT_IN_RANGE"` (unchanged; P110/P111 copy intact) | yes |
| `total` | `null` | yes |
| `subscores` | `null` (no comfort fabrication beyond caps) | yes |
| `paths` | full 17-key dict computed from the out-of-cap route (`covered_ratio`, `covered_m`, `shortest_m`, `routing_type`, snap connectors, ...) | yes |
| `exposure_gaps` | gaps list from the same route | yes |
| `best_node` | the out-of-cap node dict (`type/name/routed_m/straight_line_m/snap_distance_m/...`) | yes |
| `route_options.<type>` | `{state:"NO_TRANSIT_IN_RANGE", total:null, subscores:null, paths:<dict>, best_node:<dict>, exposure_gaps:<list>}` | yes (entry schema identical) |
| `candidates` | evaluated candidate summaries as on scored records | yes |
| `provenance` | unchanged key set; `direct_bus_fallback` continues documenting rejected candidates | yes |

### Shape B — disconnected-candidate (candidate snapped to unreachable component)

Unchanged: exact all-null serialization observed on `059804` (subscores/best_node/paths/exposure_gaps all `null`, `route_options: {}`). No honest geometry exists to publish.

### Shape C — no-candidate (nothing within search radius)

Identical to Shape B output. Unchanged.

## Schema verification

Every populated key above appears verbatim in the scored-record inventory (paths 17-key dict; route_option entry keys; top-level keys). **No new schema key is required.** No STOP condition triggered.

## Implementation surface (for P580)

Single site: `assemble_score_record` NO_TRANSIT branch accepts optional out-of-cap best-evidence carrier instead of unconditional all-nulls. Shapes B/C keep the unconditional all-null path byte-identically. Golden-range and determinism suites must stay green; P578/P581 assertions assert byte-match of B/C rows against prior subset runs (normalized timestamps only).

## Explicit non-goals

- No comfort subscore fabrication beyond caps.
- No state-value changes (P110/P111 copy untouched).
- No turn-by-turn geometry publication.
