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

## Loading-time diagnosis (review decision 2026-09-07)

Round 1 functional repairs and test portability are accepted through 53651e9.
This does not approve performance, M12 numerical budgets, or deployment. The next
delegated task is diagnosis, not new features or speculative optimization.

### Scope and safety
- Assert C:\sgSHIOK2026 as working directory before work; use absolute write paths.
- Read STATE, PRODUCT-PLAN, this brief and the repair-portability and repair-final
  summaries. Preserve every existing compute, protected-file and evidence rule.
- No scoring, export, ingestion, dependency install, deployment, production load
  test, data rewrite, feature implementation or change to approved UI.
- Use installed tools and existing local data. Write new diagnostic artifacts under
  qa/revamp-r1/loading-diagnosis/. Append verification evidence, never replace it.
- Limit diagnosis to 45 minutes. A measured blocker is a valid result. Do not kill
  unrelated processes or change system settings to manufacture a clean benchmark.

### Measure before explaining
1. Record root, host, commit, tracked dirty state, browser/runtime versions, CPU,
   available memory and paging indicators. Identify the tested repo-owned server
   and whether its build actually represents HEAD. Audit build scripts before any
   frontend-only build: no helper may prepare or change production data.
2. Start with one cold and one warm selected-walk capture at 390x844. Define cold
   and warm explicitly: browser context, HTTP cache, service worker and app memory.
   Keep postal, route, throttling and build constant. Reuse a non-personal test
   location from existing evidence; do not promote a private address in UI copy.
3. Record a timeline separating navigation/server response, scripts, score fetch,
   geometry fetch, decompression/parse, worker startup, source processing, basemap
   readiness and CURRENT selected-route render. Track request initiators, bytes,
   long tasks and memory where available. State which worker requests the capture
   includes; page-target transfer totals must not be called whole-app totals.
4. Use the existing selection-specific render key and screenshot/count capture.
   A loaded basemap or stale feature is not a loaded selected walk. Preserve actual
   loaded screenshots with matching route counts, not only timing logs.
5. Gate after the pair. If either times out at 120 seconds or memory/paging shows
   sustained host pressure, stop repetitions and provide the trace and smallest
   owner action needed. Do not infer that hardware is the only cause. Otherwise
   allow up to three cold/warm pairs per viewport, adding 1440x950. Report samples
   individually and medians; this sample size cannot establish a p95 or phone SLA.

### Deliverable and next decision
- Rank measured bottlenecks, separating observed time from causal hypotheses.
  Name code locations and evidence for each; propose the smallest discriminating
  experiment where the cause is uncertain. Do not implement product fixes yet.
- Propose M12 latency and transfer budgets, with start/end events and test conditions.
  Distinguish controlled local regression targets from real-device acceptance.
  Do not claim a throttled desktop browser is a representative phone benchmark.
- Price each proposed fix as zero-pipeline frontend work or explicitly gated data
  work. Preserve cancellation/retry, worker CSP, attribution and route evidence.
- Record findings, disagreements, commands, environment and limitations in the
  append-only verification log; update STATE and PRODUCT-PLAN. Commit coherent
  diagnostic/documentation work and push to main. Stop for independent review.
- Hand back root/host, pushed SHAs, measured bottlenecks, proposed next fix and any
  concrete owner action. No comparison/reporting scope expansion.

## Route-source separation (review authorization 2026-09-08)

The bounded diagnosis at 4d52b80 and restoration at e56ad58 are accepted within
their stated limits. This section supersedes the diagnosis-only stop for this
one implementation. It does not authorize deployment or pipeline work.

- Split the combined source-update effect in route-evidence-map.tsx by data
  ownership. Route collections must not be resubmitted merely because lamps,
  feedback, transit POIs or the active-gap highlight changed. Keep initial source
  installation and legitimate route changes functional.
- Do not deduplicate solely by render_key: same-key payload changes must still
  propagate. No JSON serialization in the render hot path just to skip writes.
- Preserve clearing to empty data, selection-specific readiness, cancellation,
  retries, route fitting, style/source recreation, overlay toggles and attribution.
  Do not change the UI, routing data, score values, source schema or dependencies.
- Add behavioral regressions using portable fixtures and source spies: initial
  publication; optional-layer-only changes producing zero route writes; active-gap
  changes affecting only the highlight; route replacement and clearing; same-key
  changed geometry; source recreation/recovery republishing current data. Retain
  stale-selection/callback and alternate-stop evidence tests. Source-string tests
  alone are insufficient. Prefer existing component/test patterns.
- Repair diagnostic trace completion handling and detached-worker bookkeeping in
  new diagnostic files, preserving original captures. Capture payload identity or
  equality off the measured hot path; distinguish repeated keys from equal data.
  Do not require complete CPU attribution to prove source-write behavior.
- Run focused tests, the isolated web suite, installed TypeScript and integrity.
  No installation. Audit any direct frontend build to avoid data-preparation hooks.
- Controlled browser comparison is separately gated by host headroom. Preserve
  cache definitions, selected postal, build identity and viewport between baseline
  and treatment. Use a fresh output directory for each capture and inspect loaded
  screenshots with current-route counts. Do not use pressure-limited 4d52b80 times
  as a clean performance baseline or assert a speedup from reduced writes alone.
- If host pressure persists, finish code/tests and hand back "browser/performance
  validation pending" with the smallest owner action; do not repeatedly benchmark
  or kill unrelated processes. M12 numerical budgets remain proposals.
- Append evidence and findings, update STATE and PRODUCT-PLAN, commit coherent
  changes and push to main, then stop for independent review. All standing path,
  protected-file, no-pipeline and no-deployment rules remain in force.
