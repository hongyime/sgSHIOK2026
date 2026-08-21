# P423 HDB missing-row copy

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
d22fd0cb3194ff3cf4ff6845728da8044aeaceaa
d22fd0cb3194ff3cf4ff6845728da8044aeaceaa	refs/heads/main
```

## git status --short before commit

```text
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Focused inspection

```text
web\app\page.tsx:129:    return `this postal is one of the 8 recent public-source postals missing from frozen v1 (${source})`;
web\lib\__tests__\accessibility-render.test.tsx:385:      "Postal 521400 is outside the published shelter-map bundle tied to the frozen June 2020 address universe; this postal is one of the 8 recent public-source postals missing from frozen v1 (HDB 2021-2026 geocoded rows)."
web\lib\__tests__\accessibility-render.test.tsx:388:      "No shelter-map walk is published for this postal; the published shelter-map bundle is tied to the frozen June 2020 address universe, and this postal is one of the 8 recent public-source postals missing from frozen v1 (HDB 2021-2026 geocoded rows)."
```

## Focused tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  39 passed (39)
   Start at  19:58:50
   Duration  7.34s (transform 4.49s, setup 0ms, import 5.98s, tests 813ms, environment 1ms)
```

## git check-ignore evidence path

```text
EXIT=1
```

## repo integrity

```text
repo_integrity=ok
EXIT=0
```

## protected path diff

```text
EXIT=0
```

## git diff --stat

```text
decisions.md                                    | 4 ++++
web/app/page.tsx                                | 2 +-
web/lib/__tests__/accessibility-render.test.tsx | 7 +++++--
web/lib/__tests__/score-card-copy.test.ts       | 2 ++
4 files changed, 12 insertions(+), 3 deletions(-)
```

## FINDINGS

1. The HDB-specific outside-bundle copy still grouped confirmed HDB missing rows with the two unvalidated MCST proxy rows as `one of the 8`.
2. The browser now says known HDB postals are one of the 6 coordinate-backed HDB missing rows; MCST proxy rows remain explicitly unvalidated source-quality evidence.
3. This is browser copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
