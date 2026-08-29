# P932 Nearby-Address Metric Helper Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed the metric-specific nearby-address comparison helper from noun fragments to active sentences:

- `Nearby-address comparison for this evidence row; locked SHIOK score is unchanged.`
- `Nearby-address comparison for this locked-score row; locked SHIOK score is unchanged.`

became:

- `Compares nearby addresses for this evidence row; locked SHIOK score is unchanged.`
- `Compares nearby addresses for this locked-score row; locked SHIOK score is unchanged.`

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P932-nearby-address-metric-helper-copy.md`

Results:

- Corrected Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P932-nearby-address-metric-helper-copy.md`: exit 1, not ignored.

## FINDINGS

1. The metric-specific comparison helper still used noun-fragment copy after the surrounding panel had moved to direct nearby-address language.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
