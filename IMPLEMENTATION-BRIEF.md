# Implementation Brief: Round 1 - Real Walk, Map First

Date: 2026-09-06
Status: authorized for implementation, tests and main-branch commits; not deployment.
Owner approved the gesture-first prototype at 0de3d5f. This document defines the
first delegated implementation round, not authority to complete every roadmap item.
Product design: ARCHITECTURE.md. Decisions: ARCHITECTURE-DECISIONS.md.
Backlog: PRODUCT-PLAN.md. Acceptance IDs: qa/SHIOK-acceptance-tests.md.

## Outcome
A person enters a six-digit postal, sees its actual walk to transit on a dominant
map, understands four metrics, and can inspect an uncovered gap on desktop/mobile.
Implement the approved layout against existing real data. Do not ship the mockup
as the application or substitute illustrative coordinates for real geometry.

## Startup and boundaries
1. Assert the process working directory is C:\sgSHIOK2026; abort otherwise.
2. Read .agents/STATE.md, AGENTS.md, web/AGENTS.md, this brief and linked designs.
   Read installed Next.js guidance where required before changing framework code.
3. Inspect status and pull main with --ff-only. Preserve unrelated local work.
   If remote changes affect this task, inspect them before proceeding.
4. Run python scripts/check_repo_integrity.py; stop on new sync damage or a failed
   input identity check. Do not repair pipeline identity by fetching/rebuilding inputs.
5. Use absolute paths for writes. Do not operate on X: or search for other clones.

Never modify pipeline/config/weights.yaml or existing payloads in web/public/data/,
qa/p6_*, qa/p7_*, qa/p8_*, qa/p9_*, qa/p10_*, qa/p11/d_*, qa/releases/ or checksums.json.
Treat raw/ and processed/ as read-only. Existing qa/verification/ lines are append-only.
No scoring, export, rescore, subset run, ingest, network build, input rebuild,
dependency installation, new backend/provider, workflow change or deployment.
Do not run the production build helper blindly: it handles protected data.
Use the existing dev/test toolchain; if a build is needed, inspect its write paths
and stop if it would touch protected artifacts. No test may regenerate them.
No paid services or unbounded resources. No secrets or personal locations in evidence.

## Approved visual contract
- Reference qa/prototypes/shelter-walk.html and shelter-desktop.png / shelter-mobile.png.
- Full-viewport map, centered search, small SHIOK identity at top left.
- Desktop floating panel approximately 270px, responsive at intermediate widths.
- Mobile bottom sheet compact by default; all four metrics visible without scrolling.
- Expanded details must remain scrollable and collapsible; attribution stays visible.
- No tagline, persistent successful-load badge, zoom/reset toolbar or empty transit section.
- Gesture pan/wheel/pinch zoom and accessible keyboard navigation remain available.
- Do not remove required OneMap logo/attribution. See https://www.onemap.gov.sg/docs/maps/.
- Keep visible failure/partial-loading recovery. Removing routine status copy does not
  authorize silent errors. Screen readers may receive concise loading announcements.
- Keep existing score, methodology and qualifications in secondary details.
- No prototype banners, hardcoded demo postal, illustrative metrics or fake gap labels
  in production. Gap labels use real descriptions when present, otherwise neutral numbering.
- Do not add inert Compare/Report controls from the mockup. Preserve working existing
  comparison/feedback capabilities in secondary details; new workflows are later rounds.

## Architecture and integration decisions
Reuse MapLibre and its built-in interactions. The prototype's custom canvas exists
only for design review and must not become the production renderer or routing engine.
Retain existing artifact schema, source selection and score formulas.
Scope normally stays in web/app/page.tsx, page.module.css, route-evidence-map.tsx,
its CSS, small new web components/helpers and corresponding tests/browser harness.
No pipeline edits are necessary. A need for them is a blocker to report.

Extract only what this slice needs: a walk summary, compact/expanded sheet and
map-view state/viewport helpers if these reduce complexity. Avoid a global state
framework, generic repository rewrite, mass formatting or unrelated cleanup.
Derive summary from the selected real record/route: destination, walk distance,
covered percentage, uncovered distance, longest gap. Preserve existing precision
and null semantics. Never substitute 0 for absent evidence or recompute a new score.
Retain existing transit category/stop and shared URL behaviour. Show a destination
chooser only when actual usable alternatives exist; no new candidate-ranking model.

## Reliability requirements
The current map load event reports ready before proving route visibility; replace
that assumption. Keep internal states distinct for record, geometry, map and optional
tiles. An optional basemap failure must not erase useful record text or route data.
Do not count basemap road lines as the selected route. Verify the selected route's
own layers and nonempty geometry in the unobscured viewport after requested fitting.
Do not mark intentional user panning away as a fetch failure or force the map back.
Readiness checks must not trigger endless refits, render loops or repeated setState.

Compute fitting padding from measured overlays, not inherited fixed 300/390px guesses.
Refit on route selection and intentional layout changes; coalesce resize work.
Do not repeatedly snap back after wheel/pinch/drag or optional layer updates.
Preserve selection on re-render; clean up map listeners/observers on unmount.
Retain bounded existing fetch caches and request deduplication. Do not add a full
island fetch to page startup or prefetch comparison data before it is requested.

Inspect loadSelectionRequestIdRef before adding request machinery: most successful
loads already check request identity. Its catch handler appeared unguarded during
review. Reproduce A failing after B succeeds; ensure A cannot replace B's UI/error.
Cover stop-preview races too if the touched code changes their behaviour.
Retry must retry the failed operation and preserve valid text/selection. Do not
perform an expensive whole-app reload or overwrite the active result with old data.

## Implementation sequence and commits
1. Record baseline observations and failing reproductions for the touched behaviours.
2. Implement coherent map lifecycle/viewport/race repairs with behavioural tests.
3. Implement the approved responsive walk UI using real records; preserve capabilities.
4. Strengthen browser checks and verify the entire slice. Fix regressions before handback.
Use one conventional commit per coherent change; push each completed commit to main.
Never amend, force-push or rewrite history. Do not stage unrelated/untracked payloads.
The exact number of commits is not a target; avoid per-word copy commits.

## Required tests and evidence
Map relevant catalogue IDs to test names and outcomes, not blanket PASS labels:
S01-S08; W01-W04, W09-W13; M01-M08, M10-M15; O10.
Existing unchanged behaviour may use existing tests, but identify the tests explicitly.
Catalogue items outside this slice remain planned; no skipped placeholders as coverage.
Use real read-only live/partial/missing-route records for data regression. Synthetic
network errors/races are fine when clearly labelled; do not claim they are real postals.

Minimum browser checks:
- Desktop 1440x950, mobile 390x844 and 390x667; include a narrow 320px layout check.
- Empty search, valid real postal, unavailable record, delayed/failed geometry/tiles.
- Route visibility after selection, sheet expansion/collapse, resize and gap focus.
- Drag, wheel, pinch and keyboard operations with no visible zoom/reset toolbar.
- Rapid A->B selection, including stale A failure; B's metrics, URL and route agree.
- No horizontal overflow, hidden key metrics, attribution overlap or uncaught errors.
For route visibility, collect screenshot AND rendered selected-route layer counts
at the same viewport/time. The old harness could pass an earlier count while its
final viewport snapshot had zero route features. Fix that gap, not the threshold.
Inspect screenshots; a green harness result is insufficient.

Run focused behavioural tests, the complete existing web suite, TypeScript checking
using the installed compiler with no incremental output, and repo integrity.
Do not change snapshots/string assertions merely to silence behaviour regressions.
Report command failures honestly. Do not invent missing test results.
Measure cold/warm text and visible-route latency plus request/transfer counts on a
documented profile, without repeated production traffic or inventing timing budgets.
Use local serving of existing data, not a production deploy, for most browser tests.

## Handback contract
Create qa/verification/REVAMP-R1-core-walk.md with commands/results and FINDINGS and
DISAGREEMENTS. New evidence is authorized; existing evidence stays append-only.
Put screenshots and a machine-readable test summary in a new qa/revamp-r1/ directory.
Commit useful bounded evidence; exclude browser profiles, credentials and payload dumps.
Update .agents/STATE.md and PRODUCT-PLAN.md with actual done/remaining work.
Do not mark the slice complete until all required checks pass or gaps are explicit.

Final reply must include:
1. Absolute working root and hostname on its first line.
2. Base/final commit, pushed SHAs and scoped changed-file list.
3. Before/after desktop/mobile screenshot paths and local preview URL.
4. Test commands/counts, selected-route feature counts per viewport, failures/limitations.
5. Catalogue IDs mapped to executed tests or specific remaining gaps.
6. Findings, disagreements, protected-file status and any approval blocker.
7. Explicit statement that production was not deployed and pipeline cost was zero.

## Review protocol and stop boundary
The reviewer independently reads diffs and evidence, prioritizes correctness and
regressions, and issues a bounded repair prompt if needed. Agent self-reported PASS
is not review approval. Do not widen scope into reports, data processing or deployment
to compensate for a blocked map test. Stop after this slice for independent review.
UI and implementation choices within this contract do not require more owner questions.
If blocked, provide the smallest concrete decision/action needed; never loop on it.
