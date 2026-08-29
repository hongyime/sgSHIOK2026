# P933 Nearby-Address Status Sentences

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed nearby-address comparison status announcements from compressed noun phrases to direct sentences:

- `Loading nearby-address covered-walkway evidence comparison.`
- `No nearby-address bus service support comparison available.`
- `5 nearby-address covered-walkway evidence comparison addresses available.`

became:

- `Loading nearby addresses for covered-walkway evidence.`
- `No comparable nearby addresses for bus service support.`
- `5 nearby addresses available for covered-walkway evidence.`

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P933-nearby-address-status-sentences.md`

Results:

- Initial focused Vitest run: 1 failed, 62 passed; the failing assertion expected the new loading string to use `rankSentenceLabel`, but `rankAnnouncement()` uses `sentenceLabel`.
- Corrected focused Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P933-nearby-address-status-sentences.md`: exit 1, not ignored.

## FINDINGS

1. Metric-specific nearby-address status announcements still read like internal comparison labels rather than sentences a screen reader user would hear naturally.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
