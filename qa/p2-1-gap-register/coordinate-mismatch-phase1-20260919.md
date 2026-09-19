# Coordinate-Mismatch Investigation — Phase 1: Source Categorization

**Date:** 2026-09-19
**Scope:** PRODUCT-PLAN-adjacent read-only analysis. Zero OneMap/Overture calls made (reused the 2026-09-19 Overture comparison report already on disk). No files outside this report written.

## Method
Grouped the 416 records with >100m coordinate delta (Overture vs. our existing coordinates) by their existing `coordinate_source` field, then compared each source's outlier rate against its total population across the full 124,443-record universe.

## Result

| coordinate_source | total in universe | outliers (>100m) | outlier rate | delta median | delta max |
|---|---:|---:|---:|---:|---:|
| osm_addr_postcode | 7,174 | 250 | **3.48%** | 157.2m | 26,004.4m |
| postal_universe_onemap_2020 | 18,406 | 160 | 0.87% | 142.6m | 1,942.8m |
| hdb_existing_building | 13,436 | 5 | 0.04% | 112.6m | 222.2m |
| ura_no_dwelling_units | 83,432 | 1 | 0.001% | 109.5m | 109.5m |
| sla_dwelling_information | 1,420 | 0 | 0% | — | — |
| onemap_search_bounded_geocode | 100 | 0 | 0% | — | — |

## Verdict on the hypothesis
**Confirmed, strongly.** `osm_addr_postcode` is 5.8% of the universe but 60.1% of all outliers, at an outlier rate 4x higher than the next-worst source (`postal_universe_onemap_2020`) and ~90x higher than `hdb_existing_building`. It also uniquely produced the extreme tail (>1000m: all 23 of those; the 26km and 15.9km worst cases are both `osm_addr_postcode`).

`postal_universe_onemap_2020` (our own 2020 OneMap-derived frozen coordinates) has a smaller but non-trivial outlier rate (0.87%) and its own max of 1.9km — worth Phase 2 attention too, just less urgently than OSM.

Sources with disproportionately *few* outliers (`hdb_existing_building`, `ura_no_dwelling_units`, `sla_dwelling_information`) look comparatively trustworthy and are lower priority for Phase 2 manual review.

## Recommendation for Phase 2 (not yet approved/started)
Prioritize manual verification in this order: (1) the 23 records over 1000m — nearly all `osm_addr_postcode`, near-certain real errors; (2) the remaining `osm_addr_postcode` outliers 100-1000m (250 total, unmanageable to check all by hand — consider a further sub-sample or automated sanity check e.g. "is the delta larger than the record's own postal sector diameter"); (3) `postal_universe_onemap_2020` outliers as a lower-priority pass.
