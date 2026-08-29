# Section 10 Presentation Reference

Status: implemented in P18. This reference documents the settled browser framing;
future edits should preserve the shelter-first hierarchy unless a new product
decision supersedes it.

## Goal

Make Section 10 lead with the artifact the project can defend today: the shelter-map
walk evidence and its exposed gaps. Keep the locked score visible, but
stop presenting the prior five locked-term rows as five independent measurements.

## Pre-P18 State

| Position | Current screen copy | Problem |
| --- | --- | --- |
| 1 | Composite SHIOK score | Leads with a blended index before showing the evidence behind the walk. |
| 2 | Access | Useful, but should sit beside walk distance and the chosen stop or exit rather than above walk exposure. |
| 3 | Bus connectivity | Carries 20% of locked weight but still partly reflects routing/conflation success. |
| 4 | Rain shelter | Uses covered-walkway shelter evidence. |
| 5 | Heat: shelter plus sparse NParks greenery proxy | Mostly the same covered-walkway shelter evidence as rain shelter, plus sparse greenery proxy. |
| 6 | Crossing friction | Low discriminating value in the locked release bundle; weighted standard deviation is about 1.11 points and 59.9% of records are exactly 100. |

## Implemented State

| Position | Display row | On-screen copy | Detail copy |
| --- | --- | --- | --- |
| 1 | Shelter exposure | `{covered_ratio}% covered-walkway ratio on the displayed walk` | `Exposed gaps show where the displayed walk leaves shelter.` |
| 2 | Walk to transit | `{sheltered_m} to {stop_or_exit}` | `Sheltered walk distance from this postal code to the chosen MRT/LRT exit or bus stop.` |
| 3 | Bus service support | `Bus support: {bus_label}` | `Shown with routing caveats where exact bus-stop walking evidence is unresolved.` |
| 4 | Locked score | `SHIOK score: {total}` | `Release sorting score using the locked weights; not five independent evidence sources.` |

Rain and heat should move from separate rows into explanatory copy:

```text
In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence.
Heat also includes a sparse NParks greenery proxy, so SHIOK shows covered-walkway ratio first
instead of asking you to compare two near-duplicate rows.
```

Bus caveat copy:

```text
A low value can mean weak service evidence, or that the published shelter-map walk
could not prove access to an official LTA bus stop. Treat it as a service-support
signal with routing caveats, not as a pure frequency score.
```

Locked score caveat copy:

```text
The locked score is fixed for this release. Use it to sort the published shelter-map data, then
inspect the shelter map and exposed gaps before deciding whether the walk actually works
for you.
```

## Layout

Top block:

```text
Where the walk is exposed
{covered_ratio}% covered-walkway ratio on the displayed walk.
{largest_gap_m} m is the longest exposed gap.
```

Primary visual:

```text
[shelter-map walk]
covered segments: solid shelter color
exposed segments: high-contrast exposed color
```

Gap list:

```text
Exposed gaps on the displayed walk
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
SHIOK's strongest evidence in this locked release is the covered-walkway ratio and exposed gaps on the shelter-map walk. The score remains the
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
Heat: shelter plus sparse NParks greenery proxy
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
- Do not hide the locked score.
- Do not present heat as measured thermal comfort.
- Do not promote bus fallback evidence into trusted bus service.
