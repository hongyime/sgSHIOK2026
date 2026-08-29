# P935 Nearby Address Aria Labels

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed remaining user-facing assistive labels from hyphenated `Nearby-address` wording to natural `Nearby address` wording:

- `Nearby-address comparison loads only when opened.`
- `aria-label="Nearby-address comparison"`
- `Choose nearby-address comparison view`

became:

- `Nearby address comparison loads only when opened.`
- `aria-label="Nearby address comparison"`
- `Choose nearby address comparison view`

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P935-nearby-address-aria-labels.md`

Results:

- Corrected Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P935-nearby-address-aria-labels.md`: exit 1, not ignored.

## FINDINGS

1. The visible panel title already used natural nearby-address copy, but assistive labels still exposed the hyphenated `Nearby-address` form.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
