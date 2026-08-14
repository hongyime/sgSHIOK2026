# Current State

Date: 2026-08-14

Task: Rebuild local dependencies on `X:\01 REPOSITORIES\sgSHIOK2026` after migration.

Status:
- `uv sync` completed after a long copy/install phase; `.venv` exists and core imports verify.
- `npm --prefix web ci` completed; `web/node_modules` exists and `npm --prefix web ls --depth=0` is clean.
- `.gitignore` now explicitly unignores `.agents/` so shared handoff state can be committed.
- `git status` source changes remain unchanged except expected untracked migration evidence dirs:
  - `qa/p10_network_provenance_20260813/`
  - `qa/p8_provenance_repair_20260813/`

Notes:
- Initial timed-out `uv sync` and `npm ci` left partial dependency trees; reruns were allowed to finish.
- `uv sync` warned that hardlinks failed and fell back to full copies, likely because cache and repo are on different filesystems.
- Do not assume huge historical scratch dirs such as `qa/p6...`, `qa/p7...`, or `qa/p9...` are fully copied unless a future task verifies them.
