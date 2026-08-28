# P720 OneMap Enumeration Feasibility

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Zero pipeline-cost feasibility pass. No scoring, export, rescore, subset run, ingest, network build, input mutation, public-data write, deployment, or locked-weight change was performed. No bulk OneMap or data.gov.sg collection was run.

## Current Evidence

The standing objective asks for a measured path before building postal-universe v2. The current cached status is already recorded in `qa/verification/P719-universe-measurement-status.md`:

```text
uv run python run.py universe-status
```

That status says the current evidence sizes the v1 gap but does not approve v2 promotion, scoring, export, or input mutation.

## Official Sources Checked

- OneMap API documentation: https://www.onemap.gov.sg/apidocs/
- OneMap Search API documentation: https://www.onemap.gov.sg/apidocs/search
- OneMap API terms of service: https://www.onemap.gov.sg/legal/apitermsofservice.html
- OneMap August 2025 workshop documentation: https://www.onemap.gov.sg/apidocs/docs/workshopaug2025
- data.gov.sg HDB Property Information: https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view
- data.gov.sg API rate limits: https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits

## Local Code Checked

```text
pipeline/probe_onemap.py
pipeline/onemap_validation.py
web/app/api/onemap.ts
web/lib/onemap-search.ts
```

Existing code uses OneMap as search, route validation, and live preview infrastructure. It does not contain a national address/postal enumeration mechanism.

## Feasibility Finding

OneMap remains the correct authority for validating candidate addresses and postals, but the public Search API is query-driven: it accepts an address, building name, road name, bus stop number, or postal code query and returns matching results. That is not the same capability as enumerating every current Singapore address or postal code.

The data.gov.sg HDB Property Information dataset is current enough to support recent-completion sampling and candidate generation, but the dataset page explicitly says to approach SingPost for postal-code information. It has block, street, year-completed, dwelling-unit and related fields, not a complete postal-code registry.

The practical v2 path is therefore:

1. Generate candidate block/street rows from current public sources such as HDB Property Information and already-measured recent-completion samples.
2. Use OneMap Search to validate and geocode those bounded candidate rows.
3. Write any accepted output only as a new numbered input artifact, never as an in-place v1 repair.
4. Treat broad national enumeration from OneMap Search alone as not established until SLA provides an explicit bulk/list endpoint or written permission and rate budget.

## FINDINGS

1. The public OneMap Search API is validation/geocoding infrastructure, not a proven bulk national address-enumeration API.
2. HDB Property Information is useful for candidate generation but is not by itself a postal-code source; the official dataset page directs users to SingPost for postal-code information.
3. The next free-tier v2 step should be a bounded candidate-generation plan and small validation design, not a scraper that tries to enumerate OneMap directly.

## DISAGREEMENTS

1. None.
