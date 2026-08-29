# P936 Night Lighting Show Layer Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Aligned night-lighting route-detail copy with the main map-layer control:

- `Switch on and zoom into a neighbourhood to load lamp-post points.`
- `Night-lighting layer off; switch on night lighting, then zoom in`
- `Switch on night lighting`

became:

- `Show the layer and zoom into a neighbourhood to load lamp-post points.`
- `Night-lighting layer hidden; show the layer, then zoom in`
- `Show night-lighting layer`

## Checks

Executed before commit:

- `npm --prefix C:\sgSHIOK2026\web test -- --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts`
- `git diff --check`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P936-night-lighting-show-layer-copy.md`

Results:

- Initial focused Vitest run: 1 failed, 62 passed; the failing assertion still expected `Switch on and zoom into a neighbourhood to load lamp-post points.`
- Corrected focused Vitest command: 2 files passed, 63 tests passed.
- `git diff --check`: exit 0.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P936-night-lighting-show-layer-copy.md`: exit 1, not ignored.

## FINDINGS

1. Night-lighting copy used both `show` and `switch on` for the same map-layer action.
2. This was free-tier web copy only; it did not run scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
