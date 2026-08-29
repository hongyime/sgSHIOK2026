# P931 Nearby-Address Closed Helper Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Changed the closed comparison-panel helper from `Loads nearby-address comparison only when opened.` to `Nearby-address comparison loads only when opened.` so the sentence names the panel first and reads as stable UI copy.

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P931-nearby-address-closed-helper-copy.md`

Results:

- Corrected Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P931-nearby-address-closed-helper-copy.md`: exit 1, not ignored.

## FINDINGS

1. The closed comparison-panel helper still led with a verb phrase, `Loads nearby-address comparison`, rather than naming the nearby-address comparison itself.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
