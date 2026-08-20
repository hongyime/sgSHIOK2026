# P60 Title-Card Source Freshness Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P60 surfaces the P59 manifest-only freshness result in the title card.
It adds visible copy that shelter, bus stops, and night lighting are current, while 6 supporting sources are stale.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\qa\verification\P60-title-card-source-freshness.md:1:# P60 Title-Card Source Freshness Evidence
C:\sgSHIOK2026\qa\verification\P60-title-card-source-freshness.md:14:P60 surfaces the P59 manifest-only freshness result in the title card.
C:\sgSHIOK2026\qa\verification\P60-title-card-source-freshness.md:15:It adds visible copy that shelter, bus stops, and night lighting are current, while 6 supporting sources are stale.
C:\sgSHIOK2026\.agents\STATE.md:5:Task: P60 title-card source freshness disclosure is in progress.
C:\sgSHIOK2026\.agents\STATE.md:13:- P60 surfaces the P59 source freshness result in the title card: shelter, bus stops, and night lighting are current while 6 supporting sources are stale. Evidence is tracked at `qa/verification/P60-title-card-source-freshness.md`. Verification still needs to run before commit. No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
C:\sgSHIOK2026\web\app\page.tsx:1944:              Source freshness: shelter, bus stops and night lighting are current; 6 supporting sources are stale.
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:39:      "Source freshness: shelter, bus stops and night lighting are current; 6 supporting sources are stale."
C:\sgSHIOK2026\decisions.md:59:Source freshness is a reporting signal, not a corruption signal. `pipeline/config/sources.yaml` now declares expected cadence and staleness thresholds by source kind, and `run.py check` reports overdue source manifests without treating staleness alone as a failed hash or changed input. The UI must disclose that the address universe remains the frozen v1 2020 SLA-derived postal set, because P19 measured a small but real current-completion miss rate and users choosing where to live should see that limitation before interpreting the score.
C:\sgSHIOK2026\decisions.md:163:Source freshness should be reportable without fetching, ingesting, or hashing upstream data. The fetch module now supports `check --freshness-only`, which reads the existing raw manifest and source freshness policy to print current/stale/manual/unknown source status. This is operational reporting only; it does not alter source cadence thresholds, inputs, exports, public data, scoring, deployment, or locked weights.
C:\sgSHIOK2026\decisions.md:171:2026-08-20 - P60 title-card source freshness:
C:\sgSHIOK2026\decisions.md:172:The title card should expose the P59 freshness result in user-facing language, not only in verification evidence. The browser now states that shelter, bus stops, and night lighting are current while 6 supporting sources are stale. This is browser copy only; it does not alter freshness thresholds, inputs, exports, public data, scoring, deployment, or locked weights.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  16:44:28
   Duration  1.89s (transform 124ms, setup 0ms, import 163ms, tests 43ms, environment 0ms)

EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:45:06
   Duration  9.20s (transform 9.06s, setup 0ms, import 11.33s, tests 12.13s, environment 13ms)

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

1. P59 recorded the source freshness result, but the browser title card still did not disclose that some supporting sources are stale while headline delivery sources are current.

## Disagreements

1. None.
