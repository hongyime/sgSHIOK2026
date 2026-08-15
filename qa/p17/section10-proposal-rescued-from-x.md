# Section 10 Presentation Proposal

Status: proposal only. This is not merged into the application UI.

## Purpose

Section 10 should lead with the strongest current evidence: route-level shelter exposure.
The locked composite score should remain visible, but it should not be presented as five
independent dimensions when two dimensions share the same shelter evidence, crossing
friction adds almost no ordering information, and bus connectivity is still partly a
routing-success artifact.

## Before

Current framing:

- Leads with the composite SHIOK score.
- Presents five weighted subscore rows: access, bus connectivity, rain shelter, heat
  comfort, and crossing friction.
- Treats rain shelter and heat comfort as separate dimensions even though the current
  evidence is dominated by covered-walkway geometry.
- Shows crossing friction as a standalone 5% row despite near-zero discriminating value
  in the current bundle.
- Shows bus connectivity as a normal 20% score even though failures still partly encode
  routing/conflation success rather than measured service quality.

## After

Recommended framing:

1. Shelter exposure
   - Primary row.
   - Copy: "Covered-walkway ratio on the selected walking route."
   - Detail: "Exposed gaps list the uncovered segments by length and location, so the
     user can see where the route is weak rather than only seeing a blended score."

2. Walk distance to transit
   - Copy: "Walking distance from this postal code to the selected transit access point."
   - Keep the selected MRT/LRT/bus target and route distance together.

3. Bus service support
   - Copy: "Nearby bus service evidence, shown with routing caveats where exact shelter
     evidence is pending."
   - Do not imply that every zero is a measured service absence.

4. Composite score
   - Copy: "Locked composite score using the current published weights."
   - Detail: "Use for sorting within this release, not as a claim that each subscore is
     equally independent evidence."

## Layout

Top of Section 10:

- Map first, occupying the dominant visual area.
- Route overlay shows covered and exposed segments.
- Exposure gaps are listed directly below or beside the map, sorted by length.

Below the map:

- Four compact rows in the order above.
- Keep the composite as a sortable release score, but demote it below route evidence.
- Keep rain and heat language in explanatory copy rather than duplicating two rows with
  the same underlying shelter signal.

## Copy

Headline:

"Where the walk is exposed"

Supporting copy:

"SHIOK's most useful current evidence is the covered-walkway trace: how much of the
selected walk is sheltered, and exactly where the exposed gaps are. The composite score
still sorts this release with the locked weights, but the shelter map is the artifact to
inspect."

Composite note:

"Composite score is locked for this release. Rain shelter and heat comfort currently
share mostly the same covered-walkway evidence, so treat the score as a release sorting
index rather than five independent measurements."

Bus note:

"Bus support is shown with routing caveats where graph connectivity is unresolved. A low
bus value may reflect missing routed evidence, not only weak service."

## Not In Scope

- No change to `pipeline/config/weights.yaml`.
- No score recomputation.
- No route or bundle regeneration.
- No UI implementation in this proposal.
