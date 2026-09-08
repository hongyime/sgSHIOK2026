# SHIOK Revamp Acceptance Test Catalogue
Date: 2026-09-06
Status: test specification; an entry is not a passing result. Individual executed
results live in qa/verification/REVAMP-R1-core-walk.md and its linked receipts.
New M16-M18/O13 cases below are planned targets, not retroactive pass claims.
Implement automated cases with the corresponding feature; do not introduce
permanently skipped tests or artificial passing placeholders.
Levels: U = unit; I = integration; B = browser; M = manual/operational.
Every case specifies a trigger and observable outcome.

## Search and selection
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| S01 | B | Enter valid six-digit postal including leading zero | Correct postal selected; zero retained |
| S02 | B | Type/paste non-digits or more than six digits | Numeric bounded input; no address API search |
| S03 | B | Submit empty/short postal | Accessible validation; no data lookup |
| S04 | I | Postal absent from bundle | Honest unavailable state; no invented score/route |
| S05 | I | Select A then B; A resolves last | B remains selected in map, summary and URL |
| S06 | B | Open valid shared postal/stop URL | Same selection restored |
| S07 | I | Malformed/unknown URL parameters | Safe fallback; no crash or arbitrary fetch |
| S08 | B | Keyboard-only search and result navigation | Visible focus and meaningful announcements |

## Walk evidence and transit
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| W01 | I | Load real fully scored fixture | Metrics match record; units/rounding consistent |
| W02 | I | Load partial evidence fixture | Available evidence shown; missing != zero |
| W03 | I | Disconnected route fixture | No drawn invented connection or success claim |
| W04 | I | Route outside eligible transit range | Explicit limitation without hiding valid evidence |
| W05 | U | Candidate is both nearest and most sheltered | One choice, no duplicate route |
| W06 | I | Switch MRT/LRT to bus | Destination and metrics stay in selected category |
| W07 | U | Missing shelter metric in candidate | Not promoted as best shelter or zero exposure |
| W08 | U | Equal candidates | Stable documented tie-break |
| W09 | B | Select gap | Corresponding route segment highlighted and visible |
| W10 | I | Switch route/destination after focusing gap | Old focus cleared; no mismatched highlight |
| W11 | B | Open summary | No weather, dryness, safety or accessibility guarantee |
| W12 | I | Transit preview request fails | Explicit preview failure; original result preserved |
| W13 | I | Inspect fixture before/after UI change | Published values and weights unchanged |

## Map reliability and performance
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| M01 | B | Cold desktop load | Selected route visible in unobscured map area |
| M02 | B | Cold mobile load | Route visible below the top-left search/result stack |
| M03 | B | Expand/collapse results; resize/rotate | Correct viewport fit; no invisible route |
| M04 | B | Basemap tiles fail | Partial state; useful text/route retained if available |
| M05 | B | Style loads but route not rendered | Must not report fully ready |
| M06 | B | Geometry fails | Retryable error; no indefinite loading |
| M07 | B | Retry failed request | Recovers without full page reload or duplicates |
| M08 | I | Duplicate simultaneous artifact requests | Shared request; consistent result |
| M09 | B | Toggle lighting off | No unnecessary ongoing overlay fetches |
| M10 | B | Pan after initial fit | No unsolicited snap-back on unrelated render |
| M11 | B | Switch postal during map initialization | Latest selection wins |
| M12 | M | Cold/warm constrained-network runs | Record transfer, text/route timing; set reviewed budget |
| M13 | B | Capture screenshot and feature counts together | Visible route asserted at same viewport/time |
| M14 | B | Reduced motion and keyboard map controls | Usable focus, labels and nonanimated alternative |
| M15 | B | All viewports | Attribution visible; no overlapping controls |
| M16 | B | Plain home, typed search, shared URL and normal revisit | Basemap appears before selection; equal-width search/results beneath top-left SHIOK; About data bottom right; selected route visible |
| M17 | B | Old-to-new build on the same origin with service worker enabled | No stale-shell/chunk blank screen or reload loop; unrelated caches preserved; versioned data caching retained |
| M18 | I | Copy diagnostics after worker/tile/geometry failure | Correct stage and retry; no postal history, query strings, tokens, report text or automatic upload |

## Home comparison
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| C01 | B | Add two then three postals | Consistent metrics and destinations side by side |
| C02 | B | Add fourth or duplicate | Clear bounded behaviour; no silent replacement |
| C03 | I | One postal lacks evidence | Missing shown; not ranked as zero |
| C04 | B | Change transit category | All columns use same category or explicit unavailable |
| C05 | B | Reload with local storage | Shortlist restored |
| C06 | I | Storage denied/corrupt/old schema | App remains usable; safe validated fallback |
| C07 | B | Explicit share | Link reproduces shortlist; warns selected postals shared |
| C08 | I | Share serialization | No report text or private draft included |
| C09 | B | Remove candidate | UI, local state and share state agree |

## Feedback and moderation
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| F01 | B | Choose mapping error vs shelter request | Separate clearly labelled form/context |
| F02 | I | Submit invalid coordinates/oversized note | Rejected safely before persistence |
| F03 | I | Submit markup/script text | Stored/rendered safely; no execution |
| F04 | I | Durable storage fails | No success claim; draft retained for retry |
| F05 | I | Retry same client request ID | At most one durable report |
| F06 | I | Submit valid report | Server receipt; private pending review |
| F07 | I | Unauthenticated access to reports/moderation | Denied; private notes not leaked |
| F08 | I | Owner accepts suggestion | Does not mutate map or establish existing shelter |
| F09 | I | Owner accepts correction | Requires evidence and separate versioned release |
| F10 | I | Reject or mark duplicate | Traceable state; no unintended publication |
| F11 | M | Abuse/free-cap exhaustion | Bounded cost; honest unavailable state |
| F12 | M | Retention/deletion policy exercise | Private data removed according to approved policy |
| F13 | B | Feedback form | No mandatory personal identity/contact details |

## Freshness, deployment and invariants
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| O01 | U | Old source checked today | Source date remains old; check date distinct |
| O02 | I | Unchanged source identity | No automatic expensive processing |
| O03 | M | Input hash differs unexpectedly | Stop; report; no rebuild repair |
| O04 | M | Approved refresh | New version only; protected old data unchanged |
| O05 | I | Legacy live / inconsistent P10 provenance fixtures | Preserve legacy/defect distinction |
| O06 | M | Release validation fails | Live pointer unchanged |
| O07 | M | Deployment fails mid-stage | Actionable stage/error; no false live claim |
| O08 | M | Approved rollback | Previous immutable release usable |
| O09 | I | Shared configuration sync candidate | Required repository protections preserved |
| O10 | M | Each implementation commit | weights.yaml and protected payloads untouched |
| O11 | M | Goal loop reaches gated task | Stops with proposal; no implicit compute/deploy approval |
| O12 | M | Fresh checkout | Design/ADR/plan discoverable without ignored docs directory |
| O13 | I | Read-only coverage audit on mixed-availability fixtures | Route and score absence classified separately; unknown cause explicit; source counts reconcile; no input or protected-output writes |

## User acceptance sessions
| ID | Level | Trigger | Expected result |
| --- | --- | --- | --- |
| U01 | M | Resident inspects a postal unaided | Identifies stop, uncovered distance and longest gap |
| U02 | M | Home seeker compares two candidates | Explains trade-off without composite-score coaching |
| U03 | M | Resident reports mapping error | Distinguishes correction from new shelter request |
| U04 | M | User sees incomplete result | Understands uncertainty instead of reading zero as fact |
| U05 | M | Mobile user inspects route and returns to summary | Completes without panel/map obstruction |

## Fixture and reporting rules
Prefer existing read-only live-bundle and P10 records; anonymize new user reports.
Network, storage and failure scenarios may use clearly labelled synthetic fixtures.
Never record personal postals, credentials or report contents in public test evidence.
For each implemented case record test path/name, execution result and commit.
Performance targets and usability sample size need agreement before final acceptance.
