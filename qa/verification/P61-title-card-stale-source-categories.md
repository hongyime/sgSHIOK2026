# P61 Title-Card Stale Source Categories Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P61 refines the title-card source freshness disclosure to name the stale supporting source categories from P59.
It keeps the headline current-source claim and says stale supporting sources include traffic signals and some greenery or boundary references.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\decisions.md:59:Source freshness is a reporting signal, not a corruption signal. `pipeline/config/sources.yaml` now declares expected cadence and staleness thresholds by source kind, and `run.py check` reports overdue source manifests without treating staleness alone as a failed hash or changed input. The UI must disclose that the address universe remains the frozen v1 2020 SLA-derived postal set, because P19 measured a small but real current-completion miss rate and users choosing where to live should see that limitation before interpreting the score.
C:\sgSHIOK2026\decisions.md:163:Source freshness should be reportable without fetching, ingesting, or hashing upstream data. The fetch module now supports `check --freshness-only`, which reads the existing raw manifest and source freshness policy to print current/stale/manual/unknown source status. This is operational reporting only; it does not alter source cadence thresholds, inputs, exports, public data, scoring, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:172:The title card should expose the P59 freshness result in user-facing language, not only in verification evidence. The browser now states that shelter, bus stops, and night lighting are current while 6 supporting sources are stale. This is browser copy only; it does not alter freshness thresholds, inputs, exports, public data, scoring, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:174:2026-08-20 - P61 stale source category copy:
C:\sgSHIOK2026\decisions.md:175:The source freshness disclosure should name the stale supporting-source categories rather than only giving a count. The browser now says the stale supporting sources include traffic signals and some greenery or boundary references, while shelter, bus stops, and night lighting remain current. This is browser copy only; it does not alter freshness thresholds, inputs, exports, public data, scoring, deployment, or locked weights.
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:39:      "Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references."
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:41:    expect(source).not.toContain("6 supporting sources are stale.");
C:\sgSHIOK2026\qa\verification\P61-title-card-stale-source-categories.md:1:# P61 Title-Card Stale Source Categories Evidence
C:\sgSHIOK2026\qa\verification\P61-title-card-stale-source-categories.md:14:P61 refines the title-card source freshness disclosure to name the stale supporting source categories from P59.
C:\sgSHIOK2026\qa\verification\P61-title-card-stale-source-categories.md:15:It keeps the headline current-source claim and says stale supporting sources include traffic signals and some greenery or boundary references.
C:\sgSHIOK2026\qa\verification\P61-title-card-stale-source-categories.md:21:1. P60 disclosed that 6 supporting sources are stale, but did not tell users what kind of supporting evidence was stale.
C:\sgSHIOK2026\.agents\STATE.md:5:Task: P61 title-card stale source categories are in progress.
C:\sgSHIOK2026\.agents\STATE.md:13:- P61 refines the title-card source freshness disclosure to name stale supporting-source categories: traffic signals and some greenery or boundary references. Evidence is tracked at `qa/verification/P61-title-card-stale-source-categories.md`. Verification still needs to run before commit. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
C:\sgSHIOK2026\.agents\STATE.md:14:- P60 surfaces the P59 source freshness result in the title card: shelter, bus stops, and night lighting are current while 6 supporting sources are stale. Evidence is tracked at `qa/verification/P60-title-card-source-freshness.md`. Verification passed: focused copy test, full web test (122 tests / 23 files), TypeScript, repo integrity, diff check, and weights diff. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change was run.
C:\sgSHIOK2026\web\app\page.tsx:1944:              Source freshness: shelter, bus stops and night lighting are current; stale supporting sources include traffic signals and some greenery or boundary references.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  16:47:20
   Duration  666ms (transform 64ms, setup 0ms, import 87ms, tests 26ms, environment 0ms)

EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:48:17
   Duration  17.41s (transform 10.81s, setup 0ms, import 15.30s, tests 25.58s, environment 39ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Diff Check

```text
DIFF_CHECK_EXIT=0
```

## Weights Diff

```text
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. P60 disclosed that 6 supporting sources are stale, but did not tell users what kind of supporting evidence was stale.

## Disagreements

1. None.
