# Coordinate-Mismatch Investigation — Phase 2: Manual Verification of Worst 23 Outliers

**Date:** 2026-09-19
**Scope:** the 23 records with >1000m coordinate delta (Overture vs. our existing coordinates). Manual review using Singapore's public postal-sector-to-district convention, known landmark locations, and 3 independent third-party postal-code lookups (web search) to cross-check the biggest/most surprising cases.

## Method and honesty about confidence

Three records were independently triangulated against a third source neither "our data" nor "Overture" (public postcode lookup sites, streetdirectory.com, straitsdata.com) — these verdicts are strong evidence, not just my own geographic judgment. The rest use Singapore's well-documented postal-district convention (first 2 digits of the postal code map to a known district) plus, for named landmarks I have specific knowledge of, direct landmark-location cross-checks. No physical site visit or GIS tool was used — this is text/knowledge-based triangulation, appropriate for a scoping pass, not a substitute for a real map-based Phase 2.5 if the owner wants full certainty on every record.

## High-confidence verdicts (independently triangulated, 3 records)

| Postal | Address | Current coord | Overture coord | Independent 3rd source | Verdict |
|---|---|---|---|---|---|
| 079000 | 61 Tras Street, Tanjong Pagar Conservation Area | 1.4177, 103.6566 (NW Singapore, near Tengah) | 1.2778, 103.8445 | streetdirectory.com + straitsdata.com confirm "Anson, Tanjong Pagar, District 2" | **Overture correct — current data wrong by 26km** |
| 207663 | 84 Syed Alwi Road | 1.3599, 103.9895 (near Loyang) | 1.3091, 103.8558 | zip.nowmsg.com postcode DB lists 207663 at 1.3091, 103.855 — matches Overture almost exactly | **Overture correct — current data wrong by 15.9km** |
| 757869 | 164 Woodlands Industrial Park E5 | 1.4303, 103.7527 | 1.4516, 103.7960 | ipostalcode.com postcode DB lists 757869 at 1.4516, 103.796 — matches Overture exactly | **Overture correct — current data wrong by 5.4km** |

## Moderate/high-confidence verdicts (postal-district or specific-landmark match, not independently triangulated)

| Postal | Address | Reasoning | Verdict |
|---|---|---|---|
| 388700 | 8A Lorong 11 Geylang | Sector 38 = Geylang district; Overture's coordinate sits in Geylang, current sits ~8km east near Tampines | Overture likely correct |
| 828837 | 21A Tebing Lane, Punggol | Sector 82 = Punggol district; Overture matches Punggol, current sits ~6.6km south near Bedok | Overture likely correct |
| 189685 | 49 Beach Road, Hexagon House | Sector 18-19 = Beach Rd/Bugis district; Overture matches, current sits ~5.8km east | Overture likely correct |
| 348548 | 190 Macpherson Road | Sector 34-37 = Macpherson district; Overture matches, current sits ~5.3km southwest near Queenstown | Overture likely correct |
| 138538 | 1 one-north Crescent, Razer SEA HQ | Specific landmark knowledge: Razer's one-north HQ is at ~1.298-1.300, 103.789-103.791 — matches Overture closely | Overture likely correct |
| 178882 | 2 Stamford Road, Swissotel The Stamford | Well-known landmark; real location ~1.293, 103.853 — matches Overture | Overture likely correct |
| 089665 | 5 Craig Road, Tanjong Pagar Conservation Area | Same conservation-area pattern as 079000; Overture's lat sits closer to the actual Tanjong Pagar core | Overture likely correct |
| 068811 | 8 Shenton Way, AXA Tower | Shenton Way's real position is further south than current's coordinate; Overture's lat fits better | Overture likely correct |

## Genuinely uncertain (delta present, but both coordinates plausible in the same general district — needs real map inspection, not a text-based verdict)

079000-089665-family aside, the following 12 records have deltas mostly in the 1,000-3,800m range where **both** candidate coordinates land inside the same broad district, and a text-only review cannot confidently pick a winner: **757698** (Admiralty Rd West), **508450** (Pulau Tekong Besar — a large island/military camp, could genuinely span this distance), **639932** (Jalan Ahmad Ibrahim, Tuas), **117403** (Harbour Drive, Pasir Panjang), **627871** (Ayer Chawan Place — the one exception sourced from `postal_universe_onemap_2020`, not `osm_addr_postcode`, worth noting it doesn't fit the OSM pattern), **629893** (Benoi Road), **149061** (Queensway), **189674** (no address text available at all — nothing to verify against), **769130** (Yishun Ave 1), **768927** (Yishun Ave 7), **628208** (Seraya Avenue), **609476** (Jurong East St 32, leaning Overture-correct but not confident enough for the table above).

## Summary
Of the 23 worst outliers: **11 have a confident-to-moderate verdict that Overture is correct and our existing coordinate is wrong** (3 independently triangulated, 8 by district/landmark match) — all 11 are `osm_addr_postcode`-sourced, consistent with Phase 1's finding that this specific source is disproportionately unreliable. **12 remain genuinely uncertain** and would need actual map-based inspection (not text-only reasoning) to resolve confidently, including the one non-`osm_addr_postcode` exception (627871).
