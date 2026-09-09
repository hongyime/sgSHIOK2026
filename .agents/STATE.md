# Current State

Date: 2026-09-09
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Startup guard: assert cwd is exactly `C:\sgSHIOK2026`; abort otherwise. All writes use absolute C: repository paths. X: is a cold mirror, never a session root.
Current task: active goal to complete PRODUCT-PLAN T01-T28. T04-T10 complete throughbd53b8b; T11 sharing complete in this change. T01/T02 PARTIAL; T12 proposal pushed1f36844 with owner decision pending. Parent alone commits/pushes; approved top-left layout unchanged. T25 cross-feature acceptance is next startable frontend task.
Evidence: qa/verification/REVAMP-R1-core-walk.md (append-only corrections and catalogue mapping).
Machine-readable handback: qa/revamp-r1/comparison-sharing-20260909/summary.json. T10:comparison-ui-20260909/summary.json. Earlier ticket handbacks and failed attempts remain in their dated QA directories and Git.
Current preview: http://127.0.0.1:4328/; QA proxy PID98528, Next4327/PID102292, buildJlm6s3tx2ilhY-4awMRJN from comparison-sharing-20260909-2. Original4321/PID97544 supplies protected data read-only. QA APIs deliberately503. Retired only command-line-verified older owned preview pairs. No deployment command run.
Checks:T11 comparison-sharing-full-3 passed1382/53 isolated tests, TypeScript/integrity/11anchors;13source hashes match tested snapshot/build2. Browser4 passed88checks/12inspected captures and ownedChrome exited. Browser3 found modal Tab-boundary gap; explicit wrapping plus17regressions fixes it. Two390x844 resize captures contain temporary raster blending; later captures clear.667px shared tables require inner scrolling. T01/T02 not closed; no performance claim.
Next:T25 keyboard/zoom/reduced-motion/cross-feature failures, excluding reporting until T18. Check shared short-screen table usability and settled resize captures. Shared fragments are ephemeral until explicit Save; preserve local list and ordinary postal queries. T10 tokens/pinned sheltered-only map guard retained. T19 read-only pilot prep and T22 freshness are also startable. OWNER:T13 service,T21 compute,T26 physical/user/M12,T28 deployment. Goal stays active.
Owner authorizes functional work under existing host load; leave other apps alone. Latest goal explicitly requests subagent verification, superseding the earlier no-delegation restriction. No pipeline, installs, deployment or protected-payload mutation authorized. Goal stays active until every task and applicable gate is actually complete.

Hard limits: never modify pipeline/config/weights.yaml; no mutation of raw/, processed/, web/public/data/, checksums.json, qa/p6_* through qa/p10_*, qa/p11/d_* or qa/releases/. Existing qa/verification/ lines are append-only. No X operations, pipeline work, dependency installs or deployment without the specific owner gate.
Build safety: never use package prebuild/data-preparation scripts. Use qa/revamp-r1/cached-release-20260908/build-snapshot.mjs with a fresh name and existing dependencies; protected payloads remain outside the snapshot.
Release safety: git pushes are not publication. web/vercel.json disables automatic Git deployments; production remains owner-controlled. Do not print or commit local .env files.
Historical handoffs remain in Git (ab671dc:.agents/STATE.md) and qa/verification/. Do not execute superseded task instructions. Durable current design is in ARCHITECTURE.md, ARCHITECTURE-DECISIONS.md and decisions.md; task status is PRODUCT-PLAN.md.
