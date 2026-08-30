# P1043 Normal User UI Cleanup

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce first-screen clutter for normal users and improve perceived map load by keeping the heavy MapLibre route map out of the initial selected-address path until the user asks for it.

## Changes

- Replaced the long title-card explanation with: `Check how sheltered the walk to transit feels before you pick a place.`
- Replaced the empty shelter-panel prose with: `See how much of the walk to transit is covered, and where it is exposed.`
- Moved visible source/date/coverage detail behind an `About the data` disclosure.
- Shortened the night-lighting always-visible note; detailed caveats remain in hover/detail contexts.
- Added `showMap` state so `RouteEvidenceMap` loads only after `Show map`, night-lighting toggle, or exposed-gap map focus.
- Added a map placeholder explaining that the map is hidden for faster loading.

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  14:21:17
   Duration  6.16s (transform 1.62s, setup 0ms, import 1.69s, tests 1.96s, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  215 passed (215)
   Start at  14:21:44
   Duration  121.19s (transform 3.08s, setup 0ms, import 9.05s, tests 88.73s, environment 12ms)
```

## Repository Integrity

```text
repo_integrity=ok
INTEGRITY_EXIT=0
```

## Locked Weights Check

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The normal-user surface was carrying operator/audit language in the always-visible title card and empty panel, making the first screen feel like evidence review rather than a consumer lookup.
2. `RouteEvidenceMap` was dynamically imported but still rendered automatically once a route existed; selected-address load still paid the MapLibre initialization cost even if the user only wanted the headline shelter metrics.
3. The map can be user-gated without removing functionality: `Show map`, night-lighting toggle, and exposed-gap focus all open it intentionally.

## Disagreements

1. None.

## Follow-up 2026-08-30: Remove Personal Sample and Remaining Clutter

The owner reported that the remaining visible copy was still too cluttered and that the Mayflower sample CTA exposed a personal/default location. The follow-up removed the sample search CTA entirely, removed the locked-score coverage line from `page.tsx`, and shortened the night-lighting hover title.

## Follow-up App String Check

```text
---APP_STRING_CHECK---
RG_EXIT=1
```

`RG_EXIT=1` means no matches were found in the app/runtime source for the checked strings:

```text
Locked-score coverage: 95,157
Night lighting layer: LTA lamp-post
Night-lighting layer: LTA lamp-post
If you moved here, see
Try Mayflower
SAMPLE_POSTAL_RESULT
sampleSearches
loadSamplePostal
```

## Follow-up Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  74 passed (74)
   Start at  17:45:32
   Duration  11.70s (transform 3.42s, setup 0ms, import 4.38s, tests 2.94s, environment 2ms)
```

## Follow-up Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  25 passed (25)
      Tests  215 passed (215)
   Start at  17:45:58
   Duration  33.73s (transform 1.95s, setup 0ms, import 6.23s, tests 11.47s, environment 10ms)
```

## Follow-up Findings

1. The Mayflower sample search CTA was a bad default for a public app because it effectively promoted a specific personal-looking location.
2. The locked-score coverage sentence is useful audit context but too dense for normal users and is no longer rendered by the page.
3. The night-lighting control still needs to exist, but its always-visible and hover copy should say what the user can do, not describe provenance policy.

## Follow-up Disagreements

1. None.
