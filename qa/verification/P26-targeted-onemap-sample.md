# P26 Targeted OneMap Sample Preparation

## Startup

```text
C:\sgSHIOK2026
PRAWN-E14
8ba1303bebf6074b467b1157b24101f0d3067714
8ba1303bebf6074b467b1157b24101f0d3067714	refs/heads/main
```

## Goal

Prepare the next bus/network-conflation measurement without calling OneMap. P25 found the API credentials are absent from the environment, but the local active bundle, postal universe, and prior full OneMap report are present.

## Planner Attempt

The first direct `plan-targeted` command exceeded a 300-second tool timeout while scanning the live bundle. The spawned process continued and later exited, but produced no output file after the parent pipe had timed out.

The successful rerun used an inline Python driver that wrote the JSON first and printed only a compact summary.

```text
{
  "best_node_type_counts": {
    "bus_stop": 50
  },
  "elapsed_seconds": 424.563,
  "eligible_records": 114140,
  "first_five_postals": [
    "509134",
    "518766",
    "508965",
    "168789",
    "486123"
  ],
  "ok": true,
  "output": "qa\\p26\\onemap_targeted_bus_risk_sample_0050.json",
  "projected_wall_clock_seconds": 100.0,
  "raw_candidate_records": 114140,
  "risk_candidate_records": 59085,
  "risk_flag_counts": {
    "bus_route": 50,
    "direct_bus_fallback_unrouted": 50,
    "scored_partial": 50,
    "very_short_route": 50
  },
  "route_trust_counts": {
    "partial_unrouted_bus_fallback": 50
  },
  "sample_size": 50,
  "state_counts": {
    "SCORED_PARTIAL": 50
  }
}
```

Tracked sample artifact:

```text
C:\sgSHIOK2026\qa\p26\onemap_targeted_bus_risk_sample_0050.json
bytes=50112
sha256=5B8727E60728E3571DAC2D1028B24D864BB01750FF9AC4AE2A47C2CD916F374A
lines=1728
```

Sample composition:

```text
{
  "best_node_type_counts": {
    "bus_stop": 50
  },
  "postals": [
    "509134",
    "518766",
    "508965",
    "168789",
    "486123",
    "458432",
    "554411",
    "507442",
    "535040",
    "510463",
    "559488",
    "279020",
    "508722",
    "459391",
    "359817",
    "638103",
    "554838",
    "556056",
    "640823",
    "127446",
    "576675",
    "289608",
    "536374",
    "458208",
    "558479",
    "579523",
    "730205",
    "521892",
    "358677",
    "738440",
    "637506",
    "533839",
    "534924",
    "637103",
    "547952",
    "278805",
    "507564",
    "805926",
    "558501",
    "297635",
    "559009",
    "556045",
    "608618",
    "276868",
    "648110",
    "417393",
    "368421",
    "277380",
    "461152",
    "535024"
  ],
  "projected_wall_clock_minutes": 1.7,
  "projected_wall_clock_seconds": 100.0,
  "risk_flag_counts": {
    "bus_route": 50,
    "direct_bus_fallback_unrouted": 50,
    "scored_partial": 50,
    "very_short_route": 50
  },
  "route_trust_counts": {
    "partial_unrouted_bus_fallback": 50
  },
  "sample_size": 50,
  "state_counts": {
    "SCORED_PARTIAL": 50
  }
}
```

Dry-run collection against the prepared sample:

```text
{
  "bundle": "generated_20260805_prefer_scored_routed",
  "cache_dir": "C:\\sgSHIOK2026\\qa\\p26\\onemap_walk_cache",
  "confirm_onemap_collection": false,
  "delay_sec": 2.0,
  "dry_run": true,
  "errors": [],
  "existing_cache_results": 0,
  "generated_at": "2026-08-16T03:43:26.136978+00:00",
  "http_requests": 0,
  "ok": true,
  "queued_requests": 50,
  "sample_size": 50,
  "will_call_onemap": false,
  "written_cache_results": 0,
  "written_error_cache_results": 0
}
```

## FINDINGS

1. The targeted sample planner is expensive on E14 because it scans the full active score/geometry bundle: 424.563 seconds for a 50-row sample plan with no API calls.
2. The prepared 50-row sample is sharply focused on the unresolved bus issue: every row is `SCORED_PARTIAL`, every best node is a bus stop, every route trust is `partial_unrouted_bus_fallback`, and every row carries `direct_bus_fallback_unrouted`.
3. Once credentials are available, the next measurement is small: 50 OneMap walk requests, projected at 100 seconds using the current 2-second delay.

## DISAGREEMENTS

1. The project should not regenerate this sample casually. The scan cost is non-trivial, and the committed sample is sufficient as the next credential-backed measurement input unless the active bundle changes.
