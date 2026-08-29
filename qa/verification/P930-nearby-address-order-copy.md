# P930 Nearby-Address Order Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed the nearby-address comparison helper from `Nearby-address list orders by locked score` to `Nearby addresses are ordered by locked score` so the open comparison panel reads as user-facing copy rather than an implementation noun.

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run web/lib/__tests__/accessibility-render.test.tsx web/lib/__tests__/score-card-copy.test.ts` failed before running tests because Vitest filters from `web/`, not the repo root.
- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P930-nearby-address-order-copy.md`

Results:

- Initial Vitest command: exit 1, no test files found because the filter used repo-root paths.
- Corrected Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P930-nearby-address-order-copy.md`: exit 1, not ignored.

## FINDINGS

1. The nearby-address comparison helper still used an internal noun phrase, `Nearby-address list`, after the panel title and ARIA labels had already moved to user-facing nearby-address copy.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
