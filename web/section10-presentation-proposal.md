# Section 10 Presentation Proposal

Status: proposal only. This is not an implementation and does not change the app UI.

## Goal

Make Section 10 lead with the artifact the project can defend today: the routed
shelter trace and its exposed gaps. Keep the locked composite score visible, but
stop presenting the current five subscore rows as five independent measurements.

## Current State

| Position | Current screen copy | Problem |
| --- | --- | --- |
| 1 | Composite SHIOK score | Leads with a blended index before showing the evidence behind the walk. |
| 2 | Access | Useful, but should sit beside route distance and transit target rather than above route exposure. |
| 3 | Bus connectivity | Carries 20% of locked weight but still partly reflects routing/conflation success. |
| 4 | Rain shelter | Uses covered-walkway shelter evidence. |
| 5 | Heat: shelter + NParks shade proxy | Mostly the same covered-walkway shelter evidence as rain shelter, plus sparse greenery proxy. |
| 6 | Crossing friction | Low discriminating value in the current bundle; weighted standard deviation is about 1.11 points and 59.9% of records are exactly 100. |

## Proposed State

| Position | Proposed row | On-screen copy | Detail copy |
| --- | --- | --- | --- |
| 1 | Shelter exposure | `Sheltered walk: {covered_ratio}%` | `Exposed gaps show where the selected walk leaves shelter.` |
| 2 | Walk to transit | `{sheltered_m} to {transit_target}` | `Selected route distance from this postal code to the chosen MRT/LRT or bus access point.` |
| 3 | Bus service support | `Bus support: {bus_label}` | `Shown with routing caveats where exact bus-stop walking evidence is unresolved.` |
| 4 | Locked composite | `SHIOK score: {total}` | `Release sorting score using the locked weights; not five independent evidence sources.` |

Rain and heat should move from separate rows into explanatory copy:

```text
Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.
Heat also includes a sparse NParks greenery proxy, so SHIOK shows the shelter trace first
instead of asking you to compare two near-duplicate rows.
```

Bus caveat copy:

```text
A low bus value can mean weak service evidence, but it can also mean the routing graph
could not prove a trusted walk to a DataMall bus stop. Treat it as a service-support
signal with routing caveats, not as a pure frequency score.
```

Locked score caveat copy:

```text
The locked score is fixed for this release. Use it to sort the current bundle, then
inspect the shelter map and exposed gaps before deciding whether a route actually works
for you.
```

## Layout

Top block:

```text
Where the walk is exposed
{covered_ratio}% of the selected walk is covered.
{largest_gap_m} m is the longest exposed gap.
```

Primary visual:

```text
[route map]
covered segments: solid shelter color
exposed segments: high-contrast exposed color
```

Gap list:

```text
Exposed gaps
1. {len_m} m near {lat}, {lon}
2. {len_m} m near {lat}, {lon}
3. {len_m} m near {lat}, {lon}
```

Four-row summary:

```text
Sheltered walk    {covered_ratio}%
Walk to transit   {sheltered_m}
Bus support       {bus_label}
SHIOK score       {total}
```

Footer note:

```text
SHIOK's current strongest evidence is the routed shelter trace. The score remains the
locked release index, but rain and heat are not independent enough today to deserve two
primary rows.
```

## Before And After

Before:

```text
SHIOK score
Access
Bus connectivity
Rain shelter
Heat: shelter + NParks shade proxy
Crossing friction
```

After:

```text
Where the walk is exposed
Sheltered walk
Walk to transit
Bus service support
Locked SHIOK score
```

## Non-Goals

- Do not change `pipeline/config/weights.yaml`.
- Do not recompute scores.
- Do not hide the composite score.
- Do not present heat as measured thermal comfort.
- Do not promote bus fallback evidence into trusted bus service.
