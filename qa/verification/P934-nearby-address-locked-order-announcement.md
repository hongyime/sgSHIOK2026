# P934 Nearby-Address Locked Order Announcement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed the overall nearby-address comparison announcements and loading text from the internal `locked score order` phrase to plain ordered-address sentences:

- `Loading nearby-address locked score order.`
- `No nearby addresses in locked score order.`
- `5 nearby addresses in locked score order.`

became:

- `Loading nearby addresses ordered by locked score.`
- `No nearby addresses with full locked scores.`
- `5 nearby addresses ordered by locked score.`

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P934-nearby-address-locked-order-announcement.md`

Results:

- Corrected Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P934-nearby-address-locked-order-announcement.md`: exit 1, not ignored.

## FINDINGS

1. The overall nearby-address announcement still exposed the internal phrase `locked score order` rather than saying the nearby addresses are ordered by locked score.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
