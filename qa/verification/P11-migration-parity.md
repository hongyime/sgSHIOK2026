# P11 Migration Portability Notes

Date: 2026-08-14

Scope: Windows-native migration notes for reproducing the current local checkout after moving the repository. These notes are portable; paths are repository-relative unless explicitly marked as a historical example.

## One-Time Windows Setup

- Use PowerShell, not WSL or Docker.
- Enable long paths once in an elevated PowerShell: `Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1`
- Configure Git once: `git config --global core.longpaths true`
- Set Python UTF-8 once: `setx PYTHONUTF8 1`
- Install Python 3.12+, uv, Node LTS, Git, and the Vercel CLI as described in `README.md`.
- Rebuild local dependencies after a fresh clone or machine move: `uv sync` and `npm --prefix web ci`.

## Fresh-Clone Missing Paths

A fresh Git clone intentionally does not contain large generated or source-data payloads ignored by `.gitignore`. The migration evidence identified these classes:

- `raw/**` data files referenced by `raw/manifest.json`, except the tracked manifest itself.
- `processed/**`, including `processed/network_island.parquet`.
- `web/public/data/**` deployed static bundles.
- Historical QA scratch/evidence directories such as `qa/p6_rerun_cost_20260812_102712/`, `qa/p7_determinism_20260813/`, `qa/p8_provenance_repair_20260813/`, `qa/p9_input_provenance_20260813/`, and `qa/p10_network_provenance_20260813/`.

Do not encode old machine roots such as `C:\shiok` or `X:\01 REPOSITORIES\SHIOK` into new scripts or manifests. If a historical artifact names those roots, treat them as provenance from the T14 machine and translate to repo-relative paths only when creating new verification notes.

## Anchor Verification After Move

After moving the checkout, verify anchors before running expensive pipeline work:

- `git --no-optional-locks status --short`
- `uv run python -VV`
- `uv run python -c "import shapely, pyproj, geopandas, igraph, h3, duckdb, numpy, pandas; print(shapely.__version__, shapely.geos_version, pyproj.__version__, pyproj.proj_version_str, geopandas.__version__, igraph.__version__, h3.__version__, duckdb.__version__, numpy.__version__, pandas.__version__)"`
- `node -v`
- `npm -v`
- `uv run pytest tests/test_production_readiness.py`

For migrated evidence, compare hashes and row counts against `qa/verification/P11-t14-artifacts.json` and keep any new comparison report path-relative. Do not rerun ingest, check, or network as part of this portability check unless explicitly assigned.

## Handoff State

`.agents/STATE.md` and `.agents/JOURNAL.md` are tracked at current `HEAD` and `.gitignore` now explicitly unignores `.agents/`. That resolves the immediate handoff visibility issue, but durable product decisions should still be appended to `decisions.md` because repository instructions say `.agents/` can be local-only in this repo and sync-bot behavior may overwrite generic agent configuration.
