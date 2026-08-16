# P25 OneMap Credential Gate

## Startup

```text
C:\sgSHIOK2026
PRAWN-E14
ad3d80e5d8ba0fba83a76cdd850948a2c9f092ac
p11-land-work
ad3d80e5d8ba0fba83a76cdd850948a2c9f092ac	refs/heads/main
```

## Intended Measurement

The next unresolved empirical question is the P3/P6 bus-zero network-conflation claim. P3 explicitly said OneMap B3 validation was not completed because credentials were unavailable, and the standing goal says credentials are now in the environment and empirical claims should be measured rather than guessed.

Existing tooling inspected:

```text
pipeline/onemap_validation.py
pipeline/probe_onemap.py
scripts/replay_onemap_outliers.py
```

The active bundle and v1 universe are present:

```text
web/public/data/generated_20260805_prefer_scored_routed	DIR	files=4848	bytes=5636292250
processed/postal_universe_candidate_full_registered_geocoded.parquet	FILE	bytes=6237203
qa/releases/20260811-full-onemap/onemap_validation_cached_report_full_scored_prefer_scored_routed_20260811.json	FILE	bytes=410694
```

## Credential Gate

Credential presence check, without printing secret values:

```text
ONEMAP_EMAIL present=False length=0
ONEMAP_PASSWORD present=False length=0
LTA_DATAMALL_ACCOUNT_KEY present=False length=0
```

Because the standing premise says credentials are available, but the environment does not contain them, no OneMap API collection was run. No scoring, export, rescore, subset run, ingest, network build, or input rebuild was run.

## FINDINGS

1. The next best empirical bus/network-conflation check is blocked at the credential gate: OneMap and DataMall credentials are not present in the process environment.
2. The local data needed to plan the targeted validation exists on C:, so this is not a data-survival or bundle-identity blocker.
3. The existing OneMap validator is the right tool for the next measurement because it can build a targeted high-risk sample from the live bundle and prior full OneMap report, then collect only a capped number of walk-route requests with explicit confirmation.

## DISAGREEMENTS

1. The standing objective says API credentials are available in the environment. Current evidence contradicts that premise.
