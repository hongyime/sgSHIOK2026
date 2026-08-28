# P768 first-view freshness copy density

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Shorten the first-viewport data-freshness disclosure while keeping the full manifest-only freshness detail on the page.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
npm --prefix web test -- score-card-copy.test.ts
uv run pytest -q --collect-only
python scripts/check_repo_integrity.py
git diff --stat
```

## Command Output

```text
npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  00:19:01
   Duration  2.50s (transform 541ms, setup 0ms, import 593ms, tests 262ms, environment 1ms)

uv run pytest -q --collect-only
612 tests collected in 67.83s (0:01:07)

python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json
protected_diff_check=ok

git diff --stat
 decisions.md                              |  3 +++
 web/app/page.module.css                   | 17 +++++++++++++++++
 web/app/page.tsx                          | 12 +++++++++++-
 web/lib/__tests__/score-card-copy.test.ts |  9 ++++++---
 4 files changed, 37 insertions(+), 4 deletions(-)
```

## FINDINGS

1. The freshness machinery was already implemented and heavily covered; the remaining issue was first-viewport density, not missing provenance or source policy.
2. The old visible paragraph mixed counts, no-probe scope, current-source warnings, source-policy coverage, stale-source names, and refresh policy into one audit-log sentence block.
3. The app now keeps a concise visible freshness line and moves the long source list plus versioned-refresh rule into an expandable detail block.

## DISAGREEMENTS

1. None for this slice.
