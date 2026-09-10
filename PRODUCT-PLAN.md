# SHIOK Revamp Execution Plan
Current product assessment: 2026-09-08
Authoritative design: ARCHITECTURE.md
Decisions: ARCHITECTURE-DECISIONS.md
Test catalogue: qa/SHIOK-acceptance-tests.md
The live product is not the full agreed service. A tested postal walk viewer is
one slice, not completion of home comparison, private reporting or maintenance.
Historical handbacks below do not override the current backlog in this section.

## Product outcomes
1. Inspect: see the actual walk to nearby transit, how much is covered, and where
   the uncovered stretches are. No live weather or promise of staying dry.
2. Compare: compare up to three possible homes using the same transit category
   and route evidence, not an opaque composite ranking.
3. Improve: privately report an incorrect map or a stretch that needs shelter,
   with an actual receipt and owner moderation.
4. Stay current: check government source updates, review reports, validate releases
   and show honest dates. Slow source publication does not excuse our own backlog.

## Current backlog, in execution order
| ID | Work and current state | Done means | Cost / gate |
| --- | --- | --- | --- |
| P0.1 | DONE locally: map mounted from plain `/`; empty selection is idle, not a geometry error. Prior checks missed this entry point. | Current production build: root, typed postal, shared URL and normal worker-controlled revisit render correctly. Evidence: qa/revamp-r1/map-first-home-20260908/summary.json. Existing selected-route retry regressions remain green. | Frontend, zero pipeline; not deployed. |
| P0.2 | DONE locally, revised by owner: SHIOK top left, search below, equal-width result below search; About data bottom right. | Narrow/mobile and desktop browser checks pass; stack measured as top padding on narrow screens and left padding on desktop. Required attribution remains visible. 242 isolated tests pass. Evidence: qa/revamp-r1/left-stack-20260908/summary.json. | Frontend, zero pipeline; no deployment invoked. |
| P0.3 | PARTIAL: current preview/build identity is in STATE; same-build revisits and visited-walk outage recovery have evidence. Automatic old-release upgrade, physical-phone acceptance and representative latency remain open. | Stable documented preview; service-worker-enabled revisit/update smoke; stale assets, worker/CSP errors and retry surfaced. No blank screen accepted from route-only tests. | Frontend/operations, zero pipeline; production publish separately approved. |
| P1.1 | DONE locally through T04-T07: bounded published choices, consistent selected metrics/geometry, and mapped exposed-section exploration. | Shortest shown and most-covered eligible published options, clear distance/coverage trade-offs, correct alternate metrics and explicit unavailable cases. Do not imply all stops were evaluated or fragments are complete logical gaps. | Frontend using existing artifacts; no new candidate computation or deployment. |
| P1.2 | DONE locally through T08-T11: bounded comparison, persistence and explicit sharing. Physical-user acceptance and release remain separate. The planning-area ranking is not this feature. | Add/remove up to 3 chosen postals; same transit category; destination, distance, covered %, uncovered distance and longest gap; explicit missing data; local persistence; validated share URL. | Frontend, zero pipeline, no accounts/provider required. |
| P1.3 | Reports are NOT a functioning service. Current tools can prepare/copy a draft, not durably submit it. | Concrete $0 storage/moderation proposal, retention/abuse policy, owner access; then two report types, bounded map location/segment, durable receipt, pending/accepted/rejected/duplicate states. | Proposal is free. Provider/infrastructure decision before submission implementation. No agency submission. |
| P2.1 | Full walk coverage remains incomplete; score coverage and route coverage are different. | Read-only gap register by postal/transit category and cause: absent address, route disconnection, selection limit, missing geometry/export, missing score. Name affected inputs and existing evidence before proposing fixes. | Read-only analysis, zero scoring/export; do not rerun settled coordinate/provenance work. |
| P2.2 | Resolve approved data gaps and source freshness, not an indiscriminate full rescore. | Versioned input/output plan, subset pilot with fixed/marginal cost, field comparisons, changed-record report, rollback and explicit release decision. | No processing authorized by this plan. Export/full rescore budget must be measured and approved. Never touch locked weights or mutate old payloads. |
| P2.3 | Maintenance is not an owned end-to-end loop. Existing source-age snapshots and scripts are not proof of scheduled completion. | Assign check/review cadence, source metadata checks, report moderation queue, honest last-check/source/release dates, failure notice and a low-cost runbook. | Mostly free operations/docs; data refresh separately gated. |
| P3.1 | Product acceptance has not happened. Browser regressions are not user research. | Observe intended users inspect a walk, compare homes and file a report; resolve actual task blockers and accessibility issues. | Zero pipeline; a few owner/recruited-user sessions. |
| P3.2 | Production release is not implied by pushing main. | Approve exact frontend/artifact version; test service-worker-on returning users, local and live data identity, rollback and free-tier request budget; explicitly deploy and smoke-test. | Deployment requires owner approval. Existing bundle stays unchanged unless separately approved. |
| Later | Arbitrary origin/destination, bus-model changes and expanded coverage. | Define candidate/routing policy and budget from the initial service's usage and gaps. | Separate design/compute approval; not silently included in current UI work. |

## What is usable already
- Postal-only lookup, selected-route metrics, gap inspection, published alternate
  selection, partial failure/retry and responsive map layout have regression evidence.
- Source updates no longer rewrite unchanged route data for every optional layer.
- Versioned data and existing test fixtures are preserved. No newly computed data
  or complete-coverage claim follows from the frontend changes.

## Why it is not there yet
The first interaction failed the map-first premise, secondary technical copy was
in the main journey, and the two broader outcomes (home comparison and real reports)
are unfinished. Verification has consumed iterations without delivering those
outcomes. Move through the backlog above; do not reopen closed provenance work as
a substitute for product delivery. Numerical speed improvement is still unproven,
but it is not a reason to prevent all feature work that uses the current data.

## Executable tickets (2026-09-08)

These tickets expand the backlog above; they do not mark unbuilt work complete.
Owner: Codex executes all agent work directly. Owner-only actions are explicit.
Layout baseline: f5896f5, the owner-requested top-left layout revision. Core walk
through T07 is pushed at ab671dc; STATE records the current tested preview.
The layout revision is complete locally, not a prerequisite to reimplement the shell.
The subsequent all-tasks goal authorizes independent subagent verification with
disjoint file scopes; the parent alone commits. No framework rewrite or new scoring model.

### How to execute this list
- Start T01, then T04-T07, then T08-T11. T02 is a bounded diagnostic/fix task,
  not permission to spend another phase exclusively measuring. T03 can follow
  T01; T12, T19 and T22 can proceed without waiting for feature dependencies.
- Keep only one implementation ticket in progress. Finish its tests, evidence,
  coherent commit and push to main before taking the next startable ticket.
- IN_PROGRESS names the one currently owned implementation. READY means no dependency is pending, not completed. WAIT_DEPS means finish
  the listed tickets first. OWNER means only the user can clear that gate.
- PARTIAL means reviewed progress is pushed but an acceptance condition remains;
  it never satisfies a dependent ticket that requires the whole task.
- A gated ticket blocks only its dependent work. Continue unrelated free work;
  ask the owner only for an actual decision, credential/account or physical action.
- Every task below is zero pipeline cost except T21, which is NOT authorized.
  Zero pipeline does not mean zero engineering effort or unlimited hosted usage.
- Use C:\sgSHIOK2026 exclusively; absolute write paths; preserve locked weights,
  frozen inputs, protected outputs, and every existing verification line.
  Do not use build scripts that prepare/mutate protected data, install dependencies,
  migrate storage, or deploy under the label of a frontend task.
- Sizes S/M/L mean roughly one narrow edit, a focused vertical slice, or several
  focused slices. They are not wall-clock estimates on this loaded machine.
  Split an L task at its stated contract/UI boundary if it cannot be verified in
  one session; no speculative estimate authorizes a long run.

### Common completion contract
Tests are written with the change, not as a final separate phase. Reuse the real
reduced fixtures and their source-hash provenance. Add clearly labelled synthetic
failure/storage/transport fixtures where needed; do not invent published data.
Run focused behavioural tests, then the isolated suite at the completed feature
boundary: `node web/scripts/test-without-production-data.mjs --reporter=dot`.
New test files must be staged
before that runner so its tracked-source snapshot includes them. Existing tests
must remain green with production-data access denied; explain count changes.
Run installed TypeScript and `python scripts/check_repo_integrity.py` as relevant.
UI changes require a direct Next production build (bypass package data preparation),
one real-browser session with service workers enabled, and inspected screenshots
at 1440x950, 390x844, 390x667 and 320x667. Match current route features to captures.
Do not mistake viewport emulation for a phone or tests for user acceptance.
Append outcomes, failures, limitations, FINDINGS and DISAGREEMENTS to existing
verification evidence. Update this ticket's status, test mapping and STATE; commit
with a conventional prefix and push main. Never rewrite prior evidence/history.
No ticket is DONE merely because a document, mock, passing count or button exists.

### [ ] T01: Make cached-release upgrades safe
- Status: PARTIAL. Size: M. Parent: P0.3.
- Depends on: none.
- Scope: `web/public/sw.js`, `web/lib/service-worker-cache.ts`, `web/lib/__tests__/deployment.test.ts`; new behavioural worker tests and fresh QA browser captures.
- Do: reproduce build A -> B on the SAME local origin/profile without clearing caches. Inspect shell/asset version handling and registration failure retry. Fix only demonstrated stale-shell, cross-cache deletion or chunk-recovery defects; preserve immutable versioned data caching and avoid reload loops.
- Tests/done: M16-M17, O06/O08. Root and shared postal work after upgrade and simulated unavailable old chunks; unrelated origin caches survive; registration failure is retryable; navigation does not add polling. Screenshot B's real selected route. A test-only build copy must exclude protected payloads and use existing dependencies, never move them.
- Gate: FREE. Local two-build test only; no deployment or protected-data rebuild.
- Progress: 2026-09-08 cache/header/registration fixes pass 289 isolated tests / 34 files, TypeScript and integrity. After explicit worker update, B renders four current features at all four sizes; 12 A JS URLs are absent and foreign/future cache contents survive. Automatic activation was not observed within 90 seconds. Origin outage preserved HTML but the artifact reader rejected missing gzip probes before using cached plain JSON. T02 now has that concrete recovery defect to fix; automatic legacy-transition acceptance remains open. Evidence: `qa/revamp-r1/cached-release-20260908/summary.json`.
- Startup follow-up 2026-09-09:358 isolated tests/37 files and real held-worker browser acceptance pass. A30-second component-startup deadline preserves walk details and offers explicit Reload page; real in-page remount failed because the library retains its worker. Reload created a new Document and worker200 at the same postal/build, then four current route features at all four sizes. Recoverable tile failures keep partial-map retry. Outer lazy-component chunks and automatic legacy-client transition remain open; this does not close T01. Evidence: `qa/revamp-r1/map-startup-20260909/summary.json`.
- Download follow-up 2026-09-09: outer component download now has a terminal deadline/error boundary, safe preload hints and stage-specific inner failures. Plain/shared entry requests the existing optional cache bootstrap. Independent review corrected wall-clock elapsed timing. Final1441/56 isolated tests, TypeScript/build/integrity and11 anchors pass. Browser attempt1 proves held-chunk timeout, usable walk text, ignored late completion and explicit Reload to the same route; attempt3 passes both actual rejected implementation imports. Attempt1's later capture drift and attempt2's rejected-HTTP-body tracking error remain preserved, not relabeled passes. Twelve captures inspected at390x844. These fault runs bypass SW/cache and do not close automatic legacy-upgrade/M17 or representative performance. Evidence: `qa/revamp-r1/map-download-recovery-20260909/summary.json`.

- Automatic-upgrade follow-up 2026-09-09: one same-origin/profile Chromium run with pinned A/B workers and cache enabled passes27/27 checks. First return remains A; the pinned B worker controls that page after1.405s, then ordinary navigation loads B-only HTML with four current route features. Four captures inspected.6 cached data and12 old JS entries plus both sentinels survive; B origin returns404 for all12 old JS URLs.1441/56 isolated tests, TypeScript/integrity and11anchors pass. T01 remains PARTIAL: first-return A map did not finish before navigation, retained-old-tab uncached lazy loading and deployed/other-browser scope are not proven. Evidence: `qa/revamp-r1/automatic-upgrade-20260909/summary.json` and `review-qualification.json`.

### [ ] T02: Reduce the next measured loading bottleneck
- Status: PARTIAL. Size: M. Parent: P0.3.
- Depends on: none.
- Scope: existing loading-diagnosis/source-separation QA harnesses; `web/lib/data.ts`, `web/components/route-evidence-map.tsx` only when attribution supports an edit.
- Do: one bounded cold/warm profile with stage timestamps, transfer counts and route writes; isolate essential map/score/geometry from optional requests. Select ONE evidenced bottleneck, regression-test and fix it. Stop profiling if host pressure prevents attribution; keep feature work moving. Do not close unrelated apps or assert hardware-only causation.
- Tests/done: M08-M13. Optional controls do not resubmit unchanged route sources; essential reads deduplicate; old/new build identities and cache definitions recorded. Report any observed latency change with limitations, or explicitly no measured improvement. M12 numerical acceptance remains provisional until a defensible profile is reviewed.
- Gate: FREE. No heavy repeated builds/baselines by default; no pipeline or representative-phone claim.
- First implementation target: T01's origin-outage report identifies a 503 compressed-format probe preventing cached plain score/geometry reads. Add bounded cache-only alternate-format recovery without masking decode failures or adding an uncached retry on 5xx. Keep any latency/automatic-upgrade claim separate.
- Progress 2026-09-09: that reader fix is implemented and independently reviewed. 318 isolated tests/35 files, TypeScript/build/integrity and 11 source anchors pass. Browser transport recovers cached score/geometry after gzip503. Final online mobile view has four selected features. Origin-outage map is not accepted: proxy records the excluded MapLibre worker returning503, and final capture exhausted its deadline. Address worker availability and pre-load error recovery under T01; no measured speedup or M12 acceptance is claimed. Evidence: `qa/revamp-r1/data-cache-recovery-20260909/summary.json`.
- Follow-up 2026-09-09: worker caching now passes the visited-walk origin-outage case. Both modules are in CacheStorage; four rendered features and all four metrics survive, with inspected byte-identical screenshots. 333 tests/35 files and actual immutable module headers pass. This supersedes only the outage failure above, not automatic legacy-upgrade, pre-load failure or M12 acceptance. Evidence: `qa/revamp-r1/worker-cache-20260909/summary.json`.

### [x] T03: Give failures a useful, privacy-safe diagnostic
- Status: DONE (failure snapshot, recovery ownership, manual fallback; not all T25/browser-platform acceptance). Size: S. Parent: P0.3.
- Depends on: T01's landed typed startup/failure and recovery interfaces, not completion of every cache-upgrade acceptance case.
- Design review 2026-09-09: use one allowlisted failure snapshot, not an event history. Never include postal/shard names, URLs, raw messages/stacks, geometry, report drafts, storage or user-agent. Keep app-build ID null until explicitly injected at compile time; pinned bundle ID is not a downloaded/verified manifest and custom data-base overrides make it unknown. Preserve map-global failures across selection changes; reject stale selection/retry completions. Copy only on activation with an accessible manual fallback and stale-copy feedback guard. No telemetry upload.
- Scope: `web/app/page.tsx`, map adapter, artifact readers, new small diagnostic helper/tests only if existing helpers cannot serve it.
- Do: verify loading/error stages and retry first. Add explicit Copy diagnostics to failure details where needed: build/artifact version, failed stage, sanitized error/status and timings. No successful-load banner, constant progress prose or remote analytics.
- Tests/done: M04-M07/M18. Offline, missing worker, tile failure and geometry failure identify the right stage; useful result remains. Copied data excludes query strings, postal history, report notes, tokens and credentials. Retry cannot restore stale selection.
- Gate: FREE. No telemetry provider or hidden upload.
- Accepted 2026-09-09: final build zXWH1w55JpwXIVpwqOzTO, 1607 tests/60 files isolated from production data, TypeScript and integrity; 98 browser assertions and nine captures cover geometry/score/worker download failures, safe explicit copying and recovery. Browser clipboard is deliberately denied, SW/cache bypassed, one published postal/emulated viewports. Native successful clipboard, full-overlay focus, cache upgrades and representative latency are not established by this receipt. Earlier clipped controls, clock interference and failure-severity regression were corrected, not silently discarded. Evidence: `qa/revamp-r1/failure-diagnostics-20260909/summary.json`. Next free work is T30.

### [x] T04: Define the usable published transit-option contract
- Status: DONE (normalizer contract, not picker integration). Size: M (contract plus shared validation). Parent: P1.1.
- Depends on: none.
- Scope: inspect `web/lib/nearest-transit.ts`, `web/lib/types.ts` and `selectionForChosenStop`; add `web/lib/published-transit-options.ts` with real-fixture and synthetic-boundary tests, contract and decisions. No picker/ranking wiring in this ticket.
- Do: enumerate what the existing fixtures and candidate shards actually supply: routed geometry, routed distance, shelter metric, gaps, category and provenance. Define eligibility and a bounded list policy from those fields. Distinguish published candidates, straight-line-only POIs and live previews. Propose a maximum of three useful choices per category; record deterministic ordering before coding it.
- Tests/done: W02-W08/W12-W13. A contract table and executable fixture cases demonstrate every eligible/missing case. No nearest WALK claim based solely on straight-line distance and no best-shelter claim for missing coverage. The bound limits displayed evidence, not an assertion that all stops were evaluated.
- Gate: FREE, read-only artifacts. Insufficient candidate evidence blocks only the unsupported option, not existing walks.
- Outcome 2026-09-09: pure shared normalizer preserves whole source representations, stable identity, separate metric/geometry/gap capabilities and unsupported-vs-conflicting evidence.328 behavioral +16 real-fixture tests pass;358 existing +344 new =702/39 isolated full suite, TypeScript/integrity and11 source identities pass. Parent retained a three-failure red regression before correcting the conflict branch; independent review approved. No ranking/page wiring or browser/coverage claim. Evidence: `qa/revamp-r1/published-options-20260909/summary.json`.

### [x] T05: Select useful options deterministically
- Status: DONE (pure selector; UI follows T06). Size: M. Parent: P1.1.
- Depends on: T04.
- Scope: `web/lib/nearest-transit.ts` or one focused selector module; candidate tests using reduced real fixtures.
- Do: select nearest and most-covered eligible published options with stable ties and deduplication; retain the currently selected valid option. Keep MRT/LRT and bus categories separate. Extract a helper only where it will be shared by picker/comparison.
- Tests/done: W05-W08/W13. Same option winning both appears once; ties, partial metrics, unknown IDs and empty categories behave deterministically; original records and numerical values remain unchanged. No live request during sorting.
- Gate: FREE. No new candidate generation or scoring.
- Outcome 2026-09-09: selector consumes the normalized pool and returns at most three distinct choices in shortest/most-covered/current/default-fallback order. It preserves reset ownership, stable unrounded ties, category boundaries and missing capabilities.67 selector tests plus702 previous =769/40 isolated tests; TypeScript/integrity and11 anchors pass. The old POI helper's false no-candidate-evidence comment is corrected; no POI behavior change. Evidence: `qa/revamp-r1/published-options-20260909/choices-summary.json`. T06 integration is next, not already rendered.

### [x] T06: Ship the bounded transit-choice interaction
- Status: DONE. Size: M. Parent: P1.1.
- Depends on: T05.
- Scope: `web/components/transit-stop-picker.tsx` and its CSS, `web/app/page.tsx`, existing selection/URL handlers and behavioural tests.
- Do: present the bounded choices only when useful; show destination and routed distance/coverage trade-offs. Reuse the existing picker rather than creating a competing one. Update map, summary and URL atomically; distinguish an optional preview from published evidence and request it only on explicit selection.
- Tests/done: S05-S08, W05-W08/W10/W12, M11/M15. Keyboard selection, rapid A/B changes, failed preview, shared stop, one-option and no-option states pass. The top-left stack stays equal-width and the map remains visible at all required sizes.
- Gate: FREE. No automatic live-route fan-out or new backend.
- Outcome 2026-09-09: normalized picker, independent candidate summary/geometry and real-ID URL targets are integrated; original evidence survives category changes, delayed geometry/POIs and stale preview responses. Preview field/provenance defects and inherited unrouted/range assertions corrected explicitly.769+195=964 isolated tests/44 files, TypeScript, direct build, integrity and11 anchors pass.54 browser checks and8 inspected captures cover keyboard choice/reset, category, shared candidate and4sizes; actual built/tested sources match. Text-cell and category-button bounds were added after visual review caught failures that page overflow checks missed. Evidence: `qa/revamp-r1/published-interaction-20260909/summary.json`. No performance, all-postal, pipeline or deployment claim. T07 legacy gap details remain open.

### [x] T07: Complete the uncovered-stretch journey
- Status: DONE. Size: S. Parent: P1.1.
- Depends on: T06.
- Scope: `web/components/walk-summary.tsx`, gap controls in `web/app/page.tsx`, existing map focus adapter/tests.
- Do: make the path from four metrics to an actual uncovered stretch and back clear. Reuse existing gap highlighting; fix concrete interaction gaps only. Keep shortest-route gaps unavailable when that geometry lacks matching evidence.
- Tests/done: W01-W04/W09-W11/W13, M03/M10/M15, U01 preparation. Every metric and highlight belongs to the selected route; switching routes clears old focus; expand/close restores context; missing is not zero. No weather/dryness/safety guarantee.
- Gate: FREE. This completes an inspectable core walk, not an all-postal coverage claim.
- Outcome 2026-09-09: mapped-section disclosure selects exact validated fragment lines, preserves logical gap statistics, and returns to the whole walk. Stale selection, shortest/preview replacement, duplicate sections, pan preservation and async keyboard-focus removal are covered.964+33+39+17+10+2=1065 isolated tests/46files, TypeScript/build/integrity/11anchors pass. Final browser acceptance and8 inspected captures at4sizes pass; two earlier harness failures remain recorded. Evidence: `qa/revamp-r1/exposure-sections-20260909/summary.json`. No physical-device/performance, pipeline or deployment claim.

### [x] T08: Define a shared home-comparison row
- Status: DONE (row contract, not comparison UI). Size: S. Parent: P1.2.
- Depends on: T05.
- Scope: `web/components/walk-summary.tsx`, `web/lib/types.ts`, proposed `web/lib/comparison.ts` and tests.
- Do: reuse or extract the selected-walk metrics adapter for up to three postals, with bundle version, category, destination, distance, coverage, uncovered distance, longest gap and explicit availability. Preserve selected-route semantics and provenance; do not invent a score.
- Tests/done: C03-C04, W01/W02/W10/W13. Same fixture yields identical numbers in walk and comparison; absent gaps stay unavailable; a bus-only record is not silently substituted into an MRT comparison.
- Gate: FREE. No rank computation or new artifact.
- Policy: ADR-16 fixes the shared category's declared default sheltered walk. Same-category top default is permitted only if no category default is declared; unavailable defaults cannot silently become candidates. Comparison adds postals, not inspector candidate snapshots. Shared metrics preserve useful text without geometry and explicit missing capabilities.
- Outcome 2026-09-09: declared-source pinning and shared walkMetrics are implemented. Review found a partial-geometry metric-conflict bypass; comparison now checks independently validated sources within the established identity group, without changing picker semantics.44 real-fixture/boundary tests plus1065 previous =1109/47 isolated tests; TypeScript/build/integrity/11anchors pass.43 existing-walk browser regression checks and8 inspected captures protect extraction compatibility, not a new comparison UI. Evidence: `qa/revamp-r1/comparison-20260909/summary.json`.

### [x] T09: Build the shortlist state and persistence
- Status: DONE (state/storage and delivery-guard contract; UI loader follows T10). Size: M. Parent: P1.2.
- Depends on: T08.
- Scope: proposed `web/lib/comparison-state.ts`, existing storage helper patterns and focused reducer/storage tests.
- Do: add/remove up to three unique six-digit postals, one shared category and active column; version the local state. Keep only the minimum shortlist state, not browsing history or report drafts. Fetch through existing readers, only when needed.
- Tests/done: C02/C05/C06/C09. Duplicate/fourth entry, leading zeros, corrupt/old storage, denied quota, reload and removal pass; storage failure never breaks search. Stale responses cannot replace changed shortlist entries.
- Gate: FREE. Local only; no account or provider.
- Outcome 2026-09-09: strict versioned three-postal state, immutable transitions, owned-key storage adapters and delivery guard pass45 independent tests;1109+45=1154/48 isolated tests, TypeScript/integrity/11anchors pass. Sparse-array encoding and truthy-open defects were reproduced then fixed. No runtime/UI import changed. T10 must actually restore before writing, invalidate fresh tokens on lifecycle changes, suppress closed-view reads and gate active map ownership; helper tests do not establish that integration. Evidence: `qa/revamp-r1/comparison-state-20260909/summary.json`.

### [x] T10: Ship home comparison in the map-first UI
- Status: DONE (local comparison; sharing and production release remain separate). Size: M. Parent: P1.2.
- Depends on: T09.
- Scope: proposed `web/components/home-comparison.tsx` and CSS, `web/app/page.tsx`, comparison browser/component tests.
- Do: contextual Add to comparison, explicit add/remove, common category and aligned evidence rows; focus one compared walk on the map without losing the shortlist. Use a compact accessible comparison view, not permanent cards covering the map. Keep the planning-area ranking secondary and distinct.
- Tests/done: C01-C04/C09, M03/M15. Two/three columns align, mobile can inspect every value and return to the route, partial failure affects only its column, and closed comparison triggers no shortlist data reads. No fabricated total ranking.
- Gate: FREE. No expansion of candidate/scoring inputs.
- Outcome 2026-09-09: pinned row/map resolver, bounded token-owning loader and explicit bottom comparison drawer are integrated. Independent review fixed an empty-reset storage write and shortest-only false map failure. Visual review added compact postal map-selection buttons, sticky headings and scroll padding for keyboard focus.1269/50 isolated tests, TypeScript/build/integrity/11anchors pass; final browser69 checks/11inspected captures at4sizes. One separate final-build cold start hit the existing map-startup timeout; it remains a T01/T02 finding, not erased by the later pass. C09 share-state agreement remains T11. Evidence: `qa/revamp-r1/comparison-ui-20260909/summary.json`.

### [x] T11: Share and restore a shortlist safely
- Status: DONE (local explicit sharing; not production release or user acceptance). Size: S. Parent: P1.2.
- Depends on: T10.
- Scope: comparison state codec, existing URL handling in `web/app/page.tsx`, share controls/tests.
- Do: validate/version an explicit share URL; define URL-vs-storage precedence; preserve ordinary single-postal links. Disclose that the link contains chosen postals; clipboard failure offers an accessible fallback.
- Tests/done: S06-S07, C06-C09. Round-trip two/three postals/category; reject unknown, duplicate, oversized and malformed state; back/forward remains coherent. No private report, note, account token or history serialized; no automatic sharing.
- Gate: FREE. No server-side saved homes.
- Outcome 2026-09-09: strict versioned fragment, URL/local precedence, ephemeral shared edits, explicit Save/Use saved and independent stale-request invalidation. Native modal copy/fallback and explicit Tab wrapping preserve keyboard control.1382/53 isolated tests, TypeScript/build/integrity/11anchors pass. Final browser88 checks/12inspected captures at4sizes validates actual route visibility, storage/URL navigation, copy feedback and approved normal layout. Two390x844 resize captures contain transient raster blending; later captures are clear.667px shared tables require inner scrolling, not simultaneous display of all metrics. Initial harness failures and the real Tab-boundary failure remain recorded. Evidence: `qa/revamp-r1/comparison-sharing-20260909/summary.json`.

### [x] T12: Present a concrete $0 reporting proposal
- Status: DONE (proposal only). Size: S. Parent: P1.3.
- Depends on: none.
- Scope: existing ARCHITECTURE/ADR/decisions and report code inspection, not live provisioning.
- Do: compare feasible durable-storage options using current official limits at execution time. Recommend one with hard usage caps, owner access, location/note minimization, idempotency, spam protection, retention/deletion, backup and failure behaviour. Separate map corrections from shelter requests; no resident accounts or contact details.
- Tests/done: F01/F11-F13 design criteria. Written API/storage/auth boundaries, realistic cap assumptions, moderator workflow, required owner actions and a rejected-option rationale; explain honestly if $0 durability cannot be supported. No signup or speculative implementation under a chosen provider.
- Gate: FREE proposal only. Provider terms/limits must be checked, not assumed permanent.
- Outcome 2026-09-09: recommend Cloudflare Workers/D1/Turnstile/Access Free with quota-driven outages, private owner moderation and bounded retention. Access requires owner payment-method setup. Reviewed proposal, alternatives, source links, API/auth boundaries, limits and unresolved implementation tests: `qa/revamp-r1/report-service-proposal-20260908.json`. Active-store deletion differs from recovery-copy retention; retry and independent deletion-ledger requirements are explicit. T13 is unapproved; no service, provisioning or deployment is claimed.

### [ ] T13: Owner approves the reporting service boundary
- Status: OWNER. Size: S. Parent: P1.3.
- Depends on: T12.
- Scope: approval recorded in decisions.md; owner account/credential setup only after explicit authorization.
- Do: obtain provider, privacy/retention, abuse-limit, access-control and moderation-cadence decisions. Identify exactly which account/secret or physical action the owner must supply.
- Tests/done: approved decision and usable least-privilege credentials via local secret storage; no secret committed. A missing approval leaves real submission disabled, with no false success.
- Gate: OWNER. Does not block T01-T11, T19-T20 or T22-T25.

### [ ] T14: Implement report validation and lifecycle contracts
- Status: WAIT_DEPS. Size: M. Parent: P1.3.
- Depends on: T13.
- Scope: proposed `web/lib/reports.ts` and focused schema/lifecycle tests; existing feedback point/segment types.
- Do: validate report type, bounded Singapore point/segment, note limits, schema, request ID and bundle context. Define pending/accepted/rejected/duplicate transitions, server-owned fields and request identity. Never treat acceptance as proof a shelter exists.
- Tests/done: F01-F03/F05/F08-F10/F13. Invalid/nonfinite coordinates, oversized payload, injected markup, forbidden transitions and client-supplied moderation fields are rejected; both report types remain distinct.
- Gate: Approved infrastructure contract; zero pipeline.

### [ ] T15: Persist reports and issue truthful receipts
- Status: WAIT_DEPS. Size: M. Parent: P1.3.
- Depends on: T14.
- Scope: proposed report API route and approved storage adapter, integration tests; no public data writes.
- Do: implement atomic idempotent submission, server receipt, private pending state, timeouts and initial abuse/cap enforcement. Deny public listing and unauthorized moderator access from the first implementation; minimize retained request metadata.
- Tests/done: F02-F07/F11. Same request retry creates at most one report; mismatched reused ID is rejected; quota/backend failure returns failure, not a receipt. Read/list and moderation access are denied without approved authorization. Failure recovery never copies notes into logs.
- Gate: T13 approval, local/test backend first. No production deployment implicit.

### [ ] T16: Ship the report composition and receipt flow
- Status: WAIT_DEPS. Size: M. Parent: P1.3.
- Depends on: T15.
- Scope: proposed report form component, existing feedback controls/map point tools, `web/app/page.tsx`, browser tests.
- Do: contextually choose mapping error or shelter request, mark a point/bounded stretch, enter an optional note, review and submit. Make draft vs sent unmistakable; preserve draft on recoverable error, show real receipt and clear sensitive state deliberately. No copied JSON masquerading as submission.
- Tests/done: F01-F06/F13, C08, M15. Keyboard/mobile map context, validation, offline/error/retry and duplicate click pass. No mandatory contact info; no private note in a share link or published evidence.
- Gate: T13 approval. End-to-end acceptance requires actual durable receipt, not only mocked success.

### [ ] T17: Build the private owner moderation queue
- Status: WAIT_DEPS. Size: M. Parent: P1.3.
- Depends on: T15.
- Scope: approved private moderation route/UI and storage rules; lifecycle/access tests.
- Do: authenticate only the moderator; list/filter pending reports, inspect context, accept/reject/mark duplicate with reasons and audit time. Keep queue/navigation separate from the resident map experience.
- Tests/done: F07-F10. Unauthenticated/unauthorized requests cannot read notes or mutate state; duplicate links resolve safely; decisions are traceable. Accepting either type never alters frozen artifacts or current map truth.
- Gate: Approved owner access. No anonymous administrative endpoint or data edits.

### [ ] T18: Exercise report failure, abuse and retention limits
- Status: WAIT_DEPS. Size: M. Parent: P1.3.
- Depends on: T16, T17.
- Scope: report integration/operational tests, approved retention worker if required, privacy/runbook entries.
- Do: test cap exhaustion, spam/idempotency races, unavailable storage, expired sessions and retention/deletion on synthetic records. Verify report lookup/receipt cannot enumerate another person's report. Document owner moderation and incident actions.
- Tests/done: F04-F07/F11-F12. Bounded costs, private state, honest failure and deletion evidence meet the approved policy; no test touches real resident data. No production receipt claim without controlled real-backend validation.
- Gate: T13-approved infrastructure only. Required before enabling reporting in production.

### [ ] T19: Build a read-only walk-coverage gap register
- Status: PARTIAL. Size: M. Parent: P2.1.
- Depends on: none.
- Scope: existing data/index readers and audit helpers; new analysis output only in a fresh approved QA directory.
- Do: begin with index metadata and a small timed read pilot. Estimate scan cost before a broader pass. Classify missing address, geometry, candidate evidence, route disconnection, range limit and missing score separately; mark unknown rather than infer a cause from absence. Reuse settled evidence, not another provenance investigation.
- Tests/done: W02-W04, O03/O10/O13. Fixture classifications and arithmetic reconcile with inspected sources. Output per-postal/category reasons, counts, unknowns, paths/identities and pilot/projection. Stop on mismatch, unsafe memory/IO behaviour or an unexpectedly unbounded read.
- Gate: FREE read-only. No score/check/ingest/network/export command; no mutation of raw, processed or existing QA/public payloads.
- Progress 2026-09-09: classifier reuses the visible walk normalizer, with 32 web
  regressions; bounded reader/locator/engine/projection have 53+23+17+45=138
  focused tests. Isolated web suite1708/62, TypeScript and integrity pass.
  The 200-record read pilot took17.900648s including12.244282s fixed startup;
  projected2537.710656s plus buffer requires3203s, above the900s full-scan gate.
  No full pass ran. Sample160 scored+35 partial+5 range-limited=200;23 of35
  partial records have a retainable published bus option. These are not national
  coverage rates. All49 selected physical inputs hash-verified; output/count
  reconciliation passes. No input mutation, pipeline, installation or deployment.
  Evidence: `qa/revamp-r1/coverage-register-20260909/pilot-analysis.json` and
  `pilot-1/summary.json`. A cheaper audited scan or a separately accepted larger
  read-only wall budget is needed before the full register can be claimed done.
  T20 remains dependent on the full register; T23/T24 are independently READY.

### [ ] T20: Propose the smallest useful data improvement
- Status: WAIT_DEPS. Size: S. Parent: P2.2.
- Depends on: T19.
- Scope: decisions and current execution plan, supported by the gap register.
- Do: choose one user-relevant gap category; separate missing export from genuinely absent input/routes. Specify prerequisites, immutable outputs, comparison fields, fixed/marginal pilot, projected cost, stop rule and rollback. Do not equate every incomplete score with a missing walk.
- Tests/done: O03-O06/O11. Owner can accept/reject a named job with bounded cost and benefit. Export-only vs routing/rescore is justified from the actual gap. Never promise historical T14 throughput on current hardware.
- Gate: FREE proposal. Not permission to run its pilot or rebuild a mismatched input.

### [ ] T21: Execute only a specifically approved data job
- Status: OWNER. Size: L. Parent: P2.2.
- Depends on: T20.
- Scope: only the job and fresh output paths explicitly approved at that time.
- Do: verify inputs, run the approved pilot, separate fixed from marginal cost, observe its gate, and proceed only within the approved budget. Preserve all old artifacts. Report changed records and value/provenance differences; request a separate release decision.
- Tests/done: O03-O06/O10-O11 and approved field-comparison criteria. New version validates, old hashes remain identical and unexpected score changes stop the job. Pilot failure or budget stop is a valid outcome, not permission to retry with a larger run.
- Gate: NOT AUTHORIZED. No pipeline action until explicit job/budget approval. Not a blocker for a frontend-only release.

### [x] T22: Separate source, check and release freshness
- Status: DONE. Size: S. Parent: P2.3.
- Depends on: none.
- Scope: DataDetails in `web/app/page.tsx`, source metadata readers/tests; no frozen manifest edits.
- Do: define typed source-updated, last-checked and release dates with unknown/stale states. Present concise facts inside About data; retain supporting records without flooding the main map. Identify what static snapshots currently exist instead of implying live monitoring.
- Tests/done: O01-O02. Checking an old source today does not make its data current; unknown date stays unknown; timezone/format handling is tested. Display-only changes cannot alter scores or protected manifests.
- Gate: FREE. No source download, re-ingest or automatic refresh.
- Accepted 2026-09-09: typed historical publisher/check/generated/publication dates,
  explicit unknowns and calendar precision; collapsed About data remains map-first.
  The three recorded source hashes match frozen manifest metadata. A known update
  with unknown freshness now says Freshness unknown, not Update date unknown.
  1629 + 43 helper cases + 4 rendered cases = 1676 isolated tests; 60 + 1 = 61 files.
  TypeScript, direct build, integrity and 11 anchors pass. Browser38 checks/7 inspected
  captures cover actual build HTML, three viewport sizes, visible dates/source rows
  and bounded disclosure scrolling. No live source check, pipeline or deployment.
  Evidence: `qa/revamp-r1/source-freshness-20260909/summary.json`.

### [ ] T23: Establish a bounded metadata-check routine
- Status: PARTIAL; local checker, review fixes, runbook and one bounded live pass complete; operational activation outstanding. Size: M. Parent: P2.3.
- Depends on: T22.
- Scope: inspect existing freshness/check automation, then a narrowly scoped read-only checker and workflow only if needed; runbook/fixtures.
- Do: choose a documented cadence and inspect source metadata, not datasets. Deduplicate notices, handle rate limits and errors, record successful/failed checks and give the owner an actionable failure notice. No automatic processing or blanket workflow rewrite.
- Tests/done: O01-O03/O14-O18. O09 remains shared-config protection, not scheduler coverage. Unchanged metadata does nothing expensive; stale/manual/unknown and unavailable endpoints remain distinct. Test scheduled logic with fixtures; do not claim a cron fired until an actual run is observed.
- Gate: FREE within existing account/source limits. New secrets/accounts, external writes or alert-provider setup require specific approval; never call run.py check/ingest/network.
- Checkpoint 2026-09-09: standalone stdlib HTTP/state/CLI and local catalog builder,
  with 39 CLI + 54 HTTP + 9 catalog + 85 state = 187 focused fixture tests passing.
  No full project-suite, live endpoint, scheduled-run or notice-delivery pass claimed.
- Catalog creation stopped before output/network: raw/manifest.json committed SHA256
  159d5f7818174da8d80eafda3be95de9cfb65aa2fc1fc94a78ab174a001b383b differs from local
  ad90df61621bea3d4a3cb207c012b988d2e9338e116ce521b00307198919ae5a. Local bytes were stable
  before/after. No diagnosis, rewrite, refresh or retry; owner must disposition it.
- Independent review remains NOT APPROVED: preserve 429 cooldown through late/cleanup
  outcomes and prevent a success report before state persistence. Fix and add regressions
  only after the stop is lifted. No source-metadata-catalog.json was produced.
- Proposed weekly metadata-only GitHub Actions + one persistent issue was not approved.
  No workflow, issue, state-cache/artifact upload, secret or external notice was created.
  Pending notices are local intents, not delivered alerts. A real scheduled run and
  destination readback remain necessary for completion. Evidence:
  `qa/revamp-r1/source-monitor-20260909/summary.json`.
- Correction 2026-09-09 after explicit owner approval: committed LF vs local CRLF
  accounts for all 235 differing bytes; all 23 source entries and parsed JSON match.
  Independent read-only verification agrees. No protected bytes changed. Initial
  catalog comparison now permits only exact LF/CRLF equivalence for the two named
  textual metadata files, recording Git/local hashes separately. Runtime anchor
  checks stay byte-exact. `source-metadata-catalog.json` was generated with 24 sources:
  14 data.gov.sg + 3 DataMall listings + 3 manual + 4 unsupported = 24.
  31 catalog + 42 CLI + 54 HTTP + 85 state = 212 focused tests pass; integrity is ok.
  No live source check; the two review defects above remain open. The original
  failed attempt is retained, not overwritten. `manifest-identity.json` and
  `catalog-create-2/command.json` in the same evidence directory record the correction.
- Update 2026-09-10: both HTTP/CLI review defects are fixed. Complete received 429
  receipts survive timeout/cleanup; state and a staged report are synced and
  read-back verified before no-overwrite completion publication. Restoration
  requires the matching verified report. Independent review cleared one local pass.
  Final stable suite: 31 catalog + 61 CLI + 76 HTTP + 85 state = 253 tests. Earlier
  failed fixture and report-publication attempts remain recorded, not passed.
- The single live pass took 172.922 seconds including wrapper startup, made 14
  metadata attempts and retained all 24 outcomes: 12 observed + 2 timeout + 3
  credentials-required + 3 manual + 4 unsupported = 24. Exit 1 correctly means
  attention required; 16 pending notices are local intents, not delivered alerts.
  Catalog, metadata inputs and runtime sources stayed byte-identical. No dataset
  fetch, retry, input change or external write ran. Runbook: README.md, Bounded
  Source Metadata Monitor (Local). Evidence: same directory's live-review-1 and
  review-fixes-summary.json; complete local report under qa/source-monitor/live-review-1.

### [x] T24: Make maintenance ownership and recovery explicit
- Status: DONE as a reviewed operating proposal, not activated operations or exercised recovery. Size: S. Parent: P2.3.
- Depends on: T22.
- Scope: existing operational docs/decisions and tracked scripts inventory, read-only metadata.
- Do: propose concrete source-check, report-review and release-review cadence; name owner actions, failures, fallback and free-cap checks. Record which payloads remain untracked/irreplaceable and a non-destructive backup/recovery proposal. Separate agent-runnable checks from physical backup and credential actions.
- Tests/done: O06-O11. A new session can identify the current frontend/artifact, find its validation and stage a rollback plan without moving live data. Reporting cadence must reconcile with T13 before reporting release. No backup or restore claimed unless exercised under its own approval.
- Gate: FREE docs/read-only. No evidence copy, migration, deletion or automatic activation.
- Progress 2026-09-10: README names proposed owners/cadences, monitor/report
  failure handling, free-cap review, protected-payload backup and isolated recovery.
  Named-path/index inspection finds P6/P7/P9 absent, P8/P10 and eight P11 d_* paths
  present/untracked; no recursive payload scan or X access. Four metadata hashes
  remained unchanged. One bounded live HTML/manifest read matches the pinned
  manifest, not all shards or the production commit.142 local source hashes match
  the prior validated snapshot. Plan-only deploy returned deploy=not_started.
  Evidence: qa/revamp-r1/maintenance-20260910/inspection.json.
- Review found existing deploy helpers can prepare data in protected directories,
  omit the lamp overlay, stage untracked web files and deploy before final preflight.
  README's normal deployment recommendation is on hold; T31 owns fixture-tested
  repair. T24 does not claim actual monitoring, moderation, backup or rollback.
- Final independent review accepts the runbook and receipt scope. Verification:
  qa/revamp-r1/maintenance-20260910/verification.json; checked-in Git deploy policy
  is distinguished from unverified remote configuration. T31 is the next safe task.
- Documentation-suite follow-up: initial 16 receipt checks did not cover the
  existing README contract. Its obsolete freshness-command assertion failed
  (1 failed, 35 passed). The contract now enforces standalone monitoring, immutable
  release hold, proposed ownership and honest proof boundaries; four new cases
  make 36 + 4 = 40 passing tests across README/agent-doc/integrity suites.
  Receipts: maintenance-20260910/docs-red-1.json and docs-green-1.json. No full
  project-suite or runtime release acceptance is claimed.

### [ ] T25: Run cross-feature accessibility and failure acceptance
- Status: PARTIAL. Size: M. Parent: P3.1.
- Depends on: T07, T11.
- Scope: web regression/browser tests and existing acceptance catalogue; narrowly scoped fixes for observed blockers.
- Do: keyboard-only, zoomed text, reduced motion, mobile viewport, failed storage/network and fast navigation across inspect/compare. Include reporting only after T18, not as a fake passing placeholder. Recheck the requested top-left stack, equal widths, About data and attribution.
- Tests/done: S08, M03-M07/M14-M18, C01-C09; applicable F cases. No inaccessible controls, hidden current route, overlapping content or stale cross-feature state. Actual screenshot/count captures and exact failures/fixes recorded.
- Gate: FREE browser work; physical device/user evidence belongs to T26.
- T11 follow-up: keep shared short-screen table scrolling usable after the extra Save/Use saved row; verify zoomed text and settled resize captures rather than treating a current route-feature count as proof that raster transitions have finished. Reporting remains excluded until T18.
- Completed slice: removed the inert outer map Tab stop; current accessible name/description and focus ring now belong to MapLibre's keyboard canvas. One comparison scroll owner fixes the measured zero-height table at enlarged text, retains the46dvh cap and sticky postal identity, and keeps horizontal commands reachable. Full isolated suite1389/54, TypeScript/integrity/11anchors pass; seven source hashes match test and build snapshots.
- Browser boundary: treatment1 has42 passing checks,18 visually inspected captures and one failed client-border assertion. Its corrected replay is not passed. Later startup/automation attempts failed; treatment4's actual screenshot shows the app's map-startup error and no basemap. Do not describe this as merely a harness failure or claim release readiness. Evidence: qa/revamp-r1/cross-feature-20260909/summary.json; old red receipts remain.
- Follow-up 2026-09-10: actual scrolled geometry failure reproduced Retry focus falling to BODY. Keyboard Retry now moves focus synchronously to the same postal's named, noninteractive column heading without changing active selection or reclaiming later focus. Eight new regression cases; final isolated web suite1717/62, TypeScript/build/integrity and11fixture anchors pass. Final browser48checks/9parent-inspected captures covers held Retry, correct geometry503 diagnostics/manual-copy fallback, denied/successful Save, Use saved, keyboard table ends at4sizes, removal and clearing.144 current/tested/built source hashes match. Source review completed; the reviewer's final image audit hit its usage limit, so final image review is parent-only. Evidence: `qa/revamp-r1/cross-feature-20260910/summary.json`.
- Findings preserved: baseline2's later timeout incorrectly expected an unverified straight-line bus option to become drawable; this harness mistake is distinct from the real BODY-focus failure. Full1 caught3stale T31 release assertions; corrected to require the approved no-install/refused-activation policy and explicit early confirmation return. Full2/build1 predate final test strengthening; full3/build2 are authoritative.
- Next: retained-old-tab M17 and the complete fast-navigation/reduced-motion/enlarged-text cross-feature replay remain open. This slice covers comparison M18 and scrolled Retry/Save/storage focus, not all T25. Native zoom, assistive technology, physical devices and representative performance remain separate. No more repeated browser launches without a new diagnostic purpose.

### [ ] T26: Owner/device and real-user task acceptance
- Status: OWNER. Size: S. Parent: P3.1.
- Depends on: T25.
- Scope: task script and append-only observations; fixes return to the responsible ticket.
- Do: supply the owner with exact unaided tasks: inspect an unfamiliar postal, explain exposure, compare two homes, interpret missing data, and submit a report only if enabled. Ask for a real phone check and a small agreed user sample; do not invent users or timings.
- Tests/done: U01-U05 and reviewed M12 profile. Actual task completion/blockers, device/context and owner acceptance recorded. Unrun report tasks stay pending. No private home postals or notes in public evidence.
- Gate: OWNER physical/user participation. Does not prevent preparing the release candidate.

### [ ] T27: Prepare a bounded frontend release candidate
- Status: WAIT_DEPS. Size: M. Parent: P3.2.
- Depends on: T01, T07, T11, T25, T29 security disposition, T31 immutable staging.
- Scope: existing deployment/readiness scripts, release tests and handback; no invocation of activation/deploy/data preparation.
- Do: name exact commit, current unchanged artifact, deploy-trigger configuration, test evidence and rollback. Include only complete features; reporting additionally needs T18 and approved operational ownership. Review request/caching/free-tier exposure using current limits before recommending release. Inspect script side effects rather than trust names.
- Tests/done: O05-O08/O10, M16-M17. Legacy provenance vs genuine defect remains distinguished; staged build works with current data; cache-upgrade and rollback procedures are specific; no protected write in dry validation. Outstanding owner/user decisions are explicit.
- Gate: FREE preparation. A push is not deployment authorization; inspect whether current Git integration auto-deploys before future runtime pushes and stop if it conflicts with this gate.

### [ ] T28: Publish an approved frontend and verify it
- Status: OWNER. Size: M. Parent: P3.2.
- Depends on: T27.
- Scope: only the exact approved deployment target/commit and unchanged artifact, existing safe deploy workflow.
- Do: obtain release approval including T26 results or an explicit limited-release exception. Deploy once, verify fresh/returning users, selected route, URLs, enabled features and request behaviour; record deployment identity. On failure stop at the named stage and follow only the approved rollback.
- Tests/done: O06-O08, M16-M17, applicable S/C/F smoke tests. Remote app actually matches the approved commit/artifact, not merely a successful push. Errors are visible and the prior release remains recoverable. Set the next maintenance review from T24.
- Gate: OWNER deployment approval. No export/rescore, existing payload overwrite or new provider implicit.

### [ ] T29: Resolve the MapLibre security advisory before deployment
- Status: OWNER for dependency installation approval; read-only triage complete. Size: S.
- Trigger: GitHub alerts26/27 are one critical advisory, GHSA-jrc7-96c5-q579, in the direct runtime maplibre-gl6.1.0 dependency. The publisher identifies6.4.1 as patched.
- Scope: after approval, package/lock, new versioned worker/shared modules and license, module URL, caching/header/identity tests. Preserve6.1.0 assets for retained clients and all protected payloads. Do not hand-patch minified vendor files.
- Do: inspect install hooks; install the exact patched dependency with no data-preparation hook. Prove package-to-worker byte identity, map startup/selected-route/retained-client behavior, TypeScript/build and isolated web tests. Review source-attribution and popup HTML input boundaries with hostile fixtures; do not infer safety from passing functional tests.
- Current observation: attributionControl is false and attribution is a static local constant. This is not a complete exploitability assessment and does not close the upstream advisory.
- Gate: owner approval for dependency installation; zero pipeline. No deployment included. Other independent free frontend tasks may proceed.
- Evidence: qa/revamp-r1/security-triage-20260909/source-corrected.json; the earlier guessed-path rg failure remains in checks.json. Owner has been asked; no installation is authorized or executed.

### [x] T30: Preserve postal search before hydration
- Status: DONE (native GET, DOM-value ownership, scripts-held and hydration-boundary acceptance). Size: S. Parent: P0.3.
- Evidence: T03 browser attempt `qa/revamp-r1/failure-diagnostics-20260909/accepted-1-KEGzaW/browser.json` submitted the usable server-rendered form before React attached its handler. A second Document navigated to `/?`; the unnamed input's postal was lost. The diagnostic harness now waits for hydration, which is not an application fix.
- Scope: `web/app/page.tsx`, server-rendered form tests and a fresh bounded browser case. Preserve the approved layout, postal-only validation and existing hydrated search.
- Do: provide a native GET fallback that retains the postal in the supported URL, or another equally reliable progressive-enhancement path. Do not hide the problem behind a longer arbitrary browser delay or claim that waiting fixes real early interaction.
- Tests/done: submit Enter and the search button while application scripts are held; the postal survives and the matching record loads after release. Invalid postal input remains rejected; hydrated search does not add full-page reloads or API fan-out. Recheck a normal shared-postal arrival.
- Gate: FREE; no pipeline, dependency installation, protected-payload mutation or deployment.
- Accepted 2026-09-09: 1607+22=1629 isolated web tests/60 files, TypeScript/integrity and direct build pass. Real application scripts held through native Enter and button submissions; the postal-only GET survives. A third scenario types before hydration and submits after it without a new input/change event. Hydrated searches switch to a different real record without reload/API/POST. Final browser passes61checks/5captures after an explicit map idle capture barrier; the first run's mid-fade screenshot is preserved and not final visual evidence. `qa/revamp-r1/native-postal-20260909/summary.json`. This does not establish physical-keyboard/device or representative latency performance. Next startable work: T19/T22.

### [x] T31: Make release preparation immutable before any deployment
- Status: DONE for fixture/source scope; real preparation and release acceptance remain T27/T28. Size: M. Parent: P3.2.
- Trigger: T24 found deploy-production -> publish -> npm build invokes data preparation in the existing bundle; staging includes untracked web children, omits lamp overlay and recompresses selected JSON. The release helper deploys before activation/final preflight and uses no-wait deployment.
- Scope: narrowly scoped release/staging helpers and synthetic fixture tests. No production invocation, real-payload staging/copy, dependency installation or workflow activation. Existing test_publish.py calls export_static_artifacts; replace those test setup calls with static synthetic fixtures before running that suite under the zero-pipeline constraint.
- Do: provide explicit non-mutating preparation, validate all approved artifacts and exact source inventory before external action, preserve existing compressed bytes and include the required overlay. Reject missing derived files rather than generating/restoring/downloading them. Separate preparation, approved deployment, ready-state verification and pointer activation; distinguish failure before versus after external changes. Never auto-commit ignore rewrites or claim no-wait means READY.
- Tests/done: O06-O08/O10-O11 contracts on synthetic fixtures; no protected writes, no implicit install/fetch, injected failures leave pre-deploy pointers unchanged, staging excludes secrets/untracked source, both artifacts and byte identities are represented, async/error states are truthful. Real build/deployment/cache/rollback acceptance stays T27/T28, not passed by fixtures.
- Gate: FREE fixture/source work only. Any actual data copy, install, deployment or activation requires its existing specific approval. No pipeline execution.
- Outcome 2026-09-10: committed-source staging, required main/overlay inventories, existing gzip bytes, creation-pinned ledger validation, direct build/test commands and pre-submission project/environment checks are implemented. Retired activation/release wrappers refuse execution; provider READY remains distinct from production smoke. Windows owned-job cleanup has real harmless process fixtures. 144 parent checks + 58 independently partitioned staging cases = 202 passed across 8 files, with current source hashes verified and peer acceptance. No real artifact staging/build/install/deploy occurred.
- Protocol incident: two legacy one-record synthetic export setup calls survived an incomplete parent edit and ran under repo/tmp. Removed the suffix, added pre-run and runtime guards, preserved manifests/failed receipts, and made no whole-turn pipeline-zero claim. Final1's startup-timing assumption and final2's immediate-exit assumption failed; corrected bounded cleanup fixtures pass. Evidence: `qa/revamp-r1/release-staging-20260910/summary.json`, `review.json`, and append-only verification log. Next free work is the remaining T25 cross-feature acceptance; T29/T27/T28 gates remain.

### Release and continuation rules
- Core walk can be released after T01 and T04-T07 plus its own applicable T25-T28
  checks; it does not need to wait for comparison, reports or a rescore. Run the
  release checks for that smaller scope and explicitly exclude unbuilt features.
- Inspect + compare is the next complete free frontend milestone. Private reports
  are a separate milestone behind T13/T18. Data expansion remains optional/gated.
- Append a receipt per completed ticket: status, commit, tests/catalogue cases,
  browser evidence where applicable, remaining limitation and next ticket.
- Resume from the first READY ticket whose dependencies are DONE; never restart
  P11-P17, old provenance debates, migrations or already accepted source separation.
- Arbitrary origin/destination, weather, bus remodel, accounts, paid services and
  a new composite/weight vector are not hidden tasks in this plan.

## Historical milestone plan
The following records retain previous plans and evidence; use the backlog above
for current scope and order.

### Original milestones
1. Complete: commit agreed design, ADR and acceptance catalogue.
2. Owner approved: gesture-first prototype at 0de3d5f, in qa/prototypes/.
   Illustrative only. Empty/missing/failure states must be implemented and verified
   against real application behaviour in Round 1, not represented as already tested.
3. Establish cold/warm map baseline. Fix visible-route readiness, viewport fitting,
   stale requests and partial failures; add behaviour and visual regression checks.
4. Implement the approved core walk journey as one vertical slice with existing data.
5. Add bounded transit choices and home comparison with local persistence/sharing.
6. Present a free feedback-storage/moderation proposal with limits, retention and
   access control. Obtain infrastructure approval before durable submission work.
7. Implement and validate private reports and moderation under that approval.
8. Produce route-coverage gap register and source-refresh plan without modifying
   inputs. Present proposed fixes, candidate policy and measured compute pilot plan.
9. Run only separately approved processing into new versioned outputs; validate,
   compare and request release approval. Do not let this block frontend milestones.
10. Conduct task-based user sessions, resolve blockers and present a release candidate.
11. Deploy only with explicit approval; verify production, record artifact/commit
    identity and establish periodic source checks and report review.

## Definition of done per milestone
A coherent user outcome, relevant passing tests, evidence of visual checks where
applicable, documented limitations, clean scoped diff, commit pushed to main.
Catalogue entries are PLANNED until mapped to executed tests or manual evidence.
No placeholder submissions, fabricated fixtures claiming live truth or blanket
green status from source-string tests.
No new heavy run to satisfy a loop; stop at approval gates with a concrete proposal.
Use absolute write paths under the internal working root. Preserve all protected
data, existing verification lines, and locked weights.

## Round 1 status
Functional and portability repairs accepted by independent review (2026-09-07),
through 53651e9; diagnosis/performance/release decisions remain separate.
Earlier commits 0c6ba4c, f9e6e20 and 0ec2510 did not establish completion.
Their source-only PASS classifications and blank-map acceptance claims are
withdrawn by append-only corrections in qa/verification/REVAMP-R1-core-walk.md.

Milestone 3: measured overlays, current-render readiness, listener cleanup, stale
failures, partial errors/retry and MapLibre worker serving repaired. Four cold/warm
observations recorded with matching inspected route captures. M12 budget agreement
remains open; severe host memory pressure and page-target byte-count scope limit
performance interpretation. No production or representative phone benchmark claim.

Milestone 4: fixed centered top search and separate identity, 270px desktop panel,
compact four-metric mobile sheet and scrollable secondary details implemented.
Actual selected-route captures show 4 features at 1440x950, 390x844, 390x667 and
320x667 without overlap/overflow. Sheet/gesture/gap checks, paused-worker readiness,
stale A-failure/B-success, preview races, shared stops and real tile/geometry recovery
are executed. Alternate-stop summaries use their own evidence. Existing locked
scores, data and working secondary capabilities are preserved.

Prior functional validation: full web suite 228 passed in 30 files; focused regressions, TypeScript,
direct frontend-only build and repo integrity passed. Machine-readable report and
scoped file list: qa/revamp-r1/repair-final/summary.json. Local preview: localhost:4318.
Implementation commits 04fae3e and 7788e35 pushed to main; evidence is included with this handback.
No pipeline run, dependency install, protected-data change or deployment.

Final test-portability repair (2026-09-07): three test files now use a tracked
9,477-byte reduced fixture: four real score rows, two route geometries and one
alternate candidate, with original values and source hashes recorded. The isolated
baseline failed six tests plus walk-suite collection; after repair, focused tests
passed 15/15 and the full suite passed 228/228 across 30 files, with no skips.
The tracked-source test copy omits web/public/data and a Node filesystem guard
blocks both its data path and the original payload path. Existing dependencies
are linked; no install or payload mutation. TypeScript and integrity passed.
These are sampled regression checks, not a complete production index audit.
Evidence: qa/revamp-r1/repair-portability/summary.json and append-only corrections
in qa/verification/REVAMP-R1-core-walk.md. No new browser run or feature work.

Remaining: representative performance validation and
reviewed numerical timing budgets. Earlier cold/warm observations do not resolve
representative performance. Stop for review after this portability repair; the
next priority is a credible loading-time diagnosis, before comparison/reporting.
No independent user-session or release approval is claimed. Milestones 5-11 remain pending.

### Independent review decision, 2026-09-07
Round 1 functional and portability repairs through 53651e9 are accepted. The
reviewer checked fixture identity and all 11 source hashes, reran the isolated
focused selection successfully, and obtained repo_integrity=ok. The full 228-test
result remains the implementation agent's committed run, not a new reviewer run.
Performance and M12 budgets remain open; this is not production release approval.
Next: the bounded diagnosis in IMPLEMENTATION-BRIEF.md, before product fixes,
comparison/reporting, or deployment. Earlier memory-constrained timings do not
establish representative latency or identify its cause.

### Loading-time diagnosis handback, 2026-09-07
One cold/warm pair at 390x844 completed on the existing local production build;
the runtime source matches the prior tested code, but the build is not stamped
with current HEAD. Current selected-route observations were 10317.5/3291.0 ms;
text was visible at 3752.5/700.4 ms. Both inspected captures show four current-key
features with matching screenshot/count state. No blank-map acceptance claimed.

Sustained host pressure triggered the required stop gate: CPU 100% in all 15 valid
samples, 707-1377 MiB available and 1441-17792 pages input/sec. No repetitions or
desktop expansion. This does not prove that hardware is the sole cause.

The largest measured intervals occur after score readiness: map initialization
and selected-source processing. Each sample submits nine sources three times,
including three writes of the same route key. Proposed smallest frontend change:
separate route-source writes from optional lamp/feedback/POI updates. Its latency
benefit is a hypothesis to test after review, with zero pipeline cost; no fix is
implemented. Evidence, code locations, alternatives and proposed M12 budgets are
in qa/revamp-r1/loading-diagnosis/analysis.json and findings.json.

Native body read/decompression/parse remain combined. Server-internal execution
and worker transfer attribution remain unresolved; V8 trace export contained zero
events. Correct telemetry and obtain owner-arranged host headroom before another
controlled pair. Whole-app transfer, representative phone performance, reviewed
M12 budgets and release approval remain open. Stop for independent review.

### Route-source separation handback, 2026-09-08
Implemented only the fc6d1c6 authorization. The four route-owned sources now
publish separately from POIs, lamps, feedback and the active-gap highlight.
Executed component effect tests show zero route writes for those optional-only
changes; gap focus/clear still moves the camera intentionally. Replacement and
empty clearing publish all four route sources. Changed geometry at the same
postal/route ID propagates with a fresh readiness revision, without key-only
deduplication or JSON serialization for publication decisions.

Style recreation and explicit retry republish current collections, restore lamp
visibility/chosen-stop filters and rearm current-selection readiness. Queued retry
callbacks become inert on settlement/cleanup; repeated recovery does not accumulate
listeners. Stable default empty feedback avoids unrelated feedback writes.
Focused checks: 18 passed in 4 files. Isolated full suite: 236 passed in 31 files,
no failures/skips; existing dependencies linked, original and copied production
data paths denied. Installed TypeScript and integrity pass. Six diagnostic tests
prove completion-event waiting, detached-worker accounting and off-window payload
fingerprints. Original diagnostic files/captures and verification lines remain.

Browser/performance validation pending: seven valid host samples all show 100%
CPU, 541-835 MiB available and sustained page reads. No browser comparison, build,
new screenshot/count pair or latency saving is claimed. Reduced writes establish
publication behavior only. The accepted prior diagnosis recorded 27 source writes
EACH run, 54 across the pair; its pressured times are not a clean baseline.
Smallest owner action: provide a quieter session or suitable host, then audit
baseline/treatment builds and run the gated matching-profile comparison using the
new diagnostic driver. Native attribution, representative performance, M12 budgets
and release remain open. Evidence: qa/revamp-r1/route-source-separation/summary.json
and appended qa/verification/REVAMP-R1-core-walk.md. No pipeline, installation,
protected-data change, UI/schema change, deployment or unrelated feature.
Stop for independent review of this implementation before further work.

### Direct current-build visual validation, 2026-09-08
Owner authorized execution under existing host pressure without closing apps.
Codex built the treatment directly with installed Next, bypassing the data helper;
build and TypeScript passed in 293.676 seconds. Current local preview is :4319.
The completed browser run passed 19 checks. Inspected captures at 1440x950,
390x844, 390x667 and 320x667 show four current route features with readable metrics
and no overlap. Lamp/gap source isolation, retry, style recreation and actual
alternate-exit selection have browser evidence. Initial harness serialization
failure is preserved and corrected, not counted as a product regression.
Functional browser validation of source separation is accepted. This is not a
baseline/treatment speed comparison, native-phone result or deployment approval.
No further headroom-gated functional replay is required for this change. M12
numerical budgets and representative latency remain open separately.
Evidence: qa/revamp-r1/direct-visual-20260908/summary.json and appended review log.
