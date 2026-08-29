# P938 Browser Freshness Snapshot Date

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Measurement

`uv run python C:\sgSHIOK2026\run.py check --freshness-only` completed successfully. It reported:

- checked at `2026-08-29T09:38:59.147317+00:00`
- `Freshness: current 11, stale 9, manual 3, unknown_policy 0, unknown_age 1`
- oldest current source: `building_points (HDB Existing Building, 69.3d of 120d threshold, 50.7d until stale)`
- stale sources ordered by days past threshold: `planning_area_boundary`, `nparks_tracks`, `nparks_heritage_road_green_buffers`, `traffic_signals`, `overhead_bridge_underpass`, `covered_linkway`, `nparks_heritage_trees`, `nparks_nature_ways`, `leaf_area_index`
- action: `Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.`

The command is the explicitly safe manifest/source-policy report: it probes no upstream URLs and writes no manifest.

## Change

Updated browser data-limit copy from the previous 28 Aug 2026 22:21 UTC source-age snapshot to the measured 29 Aug 2026 09:38 UTC snapshot. The classification counts and source ordering stayed unchanged.

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py -q`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff --check`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P938-browser-freshness-snapshot-date.md`

Results:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`: 2 files passed, 63 tests passed.
- `uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py -q`: 3 passed.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff --check`: exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P938-browser-freshness-snapshot-date.md`: exit 1, not ignored.

## FINDINGS

1. The browser still showed the 28 Aug 2026 22:21 UTC source-age snapshot even though the latest safe freshness-only report was measured on 29 Aug 2026 09:38 UTC.
2. The measured counts stayed stable at 11 current, 9 stale, 3 manual, and 1 unknown-age candidate; only the dated snapshot text needed updating.

## DISAGREEMENTS

1. None.
