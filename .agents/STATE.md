# Current State

Date: 2026-08-14

Task: Subagent C, Strands 3 and 5 only.

Status:
- Read the full OneMap release report blocks needed for Strand 3 without modifying protected release evidence.
- Updated `scripts/production_readiness.py` summary text only, so failed cached OneMap validation summaries name failing criteria and failing subsets.
- Added focused assertions in `tests/test_production_readiness.py`.
- Replaced `qa/verification/P11-migration-parity.md` with portable Windows migration notes.
- Normalized old diagnostic scripts under `pipeline/diag_*.py` to resolve `raw/` from the repo root instead of old T14 absolute paths.
- Appended the P11 portability decision to `decisions.md`.

Constraints observed:
- Did not touch `pipeline/config/weights.yaml`, protected QA release/history paths, `web/public/data/`, or `checksums.json`.
- Did not run ingest/check/network.

Verification:
- `.venv\Scripts\python.exe -m py_compile scripts\production_readiness.py tests\test_production_readiness.py pipeline\diag_c2.py pipeline\diag_f3.py pipeline\diag_linkway_length.py pipeline\diag_traffic_signals.py` passed.
- `uv run pytest tests/test_production_readiness.py` failed before pytest because `uv` could not open `uv.toml` with Windows error 1450.
- `.venv\Scripts\python.exe -m pytest tests/test_production_readiness.py` failed during pytest/plugin import with Windows error 1450.
- Retried with `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`; command timed out before producing test results.

Next:
- Re-run the focused pytest command when the Windows resource condition clears.
