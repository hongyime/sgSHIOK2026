# P814 Score-Card Evidence Announcements

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Scope

- Used the local `frontend-design` and `react-dev` skills because this is a React score-card accessibility/copy change.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or locked-weight change was performed.
- Spawned read-only reviewer subagent `Darwin` to attack score-card copy/accessibility state. It found the direct-bus fallback screen-reader announcement still used `Shelter-map walk evidence`.

## Trackability

```text
exit=1
```

`git check-ignore -v qa/verification/P814-scorecard-evidence-announcements.md` returned exit 1, so the evidence path is trackable.

## Focused Test Output

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  61 passed (61)
   Start at  07:01:01
   Duration  8.17s (transform 2.66s, setup 0ms, import 3.22s, tests 2.12s, environment 1ms)
```

## Collect-Only Output

```text
629 tests collected in 13.25s
```

## Repository Integrity Output

```text
repo_integrity=ok
exit=0
```

## Protected Diff Guard

Command:

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases ':(glob)qa/p6_*' ':(glob)qa/p7_*' ':(glob)qa/p8_*' ':(glob)qa/p9_*' ':(glob)qa/p10_*' ':(glob)qa/p11/d_*'
```

Output:

```text
```

## Change

- `web/app/page.tsx` now gives non-empty exposed-gap lists `aria-label="Exposed gap evidence"`, matching the zero-gap evidence region.
- `shelterEvidenceAnnouncementFromValues()` now accepts an evidence label with the existing `Shelter-map walk evidence` default.
- Direct-bus fallback calls pass `Straight-line bus estimate evidence`, avoiding a screen-reader contradiction with `No verified shelter-map walk yet`.
- Rendered and source-level tests cover both contracts.

## FINDINGS

1. Non-empty exposed-gap lists had no accessible evidence-region label, while the zero-gap state did. The primary shelter evidence block is now consistently named for assistive technology.
2. Direct-bus fallback status text could announce `Shelter-map walk evidence` even though the same card correctly said `No verified shelter-map walk yet`. The announcement now uses straight-line fallback wording for that state.

## DISAGREEMENTS

1. None.
