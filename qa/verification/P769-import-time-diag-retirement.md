# P769 import-time diagnostic retirement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Retire import-time diagnostic scripts that read raw geospatial inputs before an operator can confirm scope, root, or output paths.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
uv run pytest tests/test_legacy_diag_scripts.py -q
uv run pytest -q --collect-only
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml checksums.json
git diff --stat
```

## Command Output

```text
uv run pytest tests/test_legacy_diag_scripts.py -q
.                                                                        [100%]
1 passed in 6.00s

uv run pytest -q --collect-only
613 tests collected in 25.75s

python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json
protected_diff_check=ok

git diff --stat
 decisions.md                    |  3 +++
 pipeline/diag_c2.py             | 40 ++++++++++------------------------------
 pipeline/diag_d1.py             | 40 +++++++++++-----------------------------
 pipeline/diag_linkway_length.py | 38 +++++++++++---------------------------
 4 files changed, 35 insertions(+), 86 deletions(-)
```

## FINDINGS

1. `pipeline/diag_c2.py`, `pipeline/diag_d1.py`, and `pipeline/diag_linkway_length.py` still performed raw geospatial reads at module import time.
2. `pipeline/diag_d1.py` also used a relative `Path("raw")`, so importing it from the wrong working directory could read the wrong tree.
3. These diagnostics are historical one-off probes. The maintained operator surface now uses guarded runner tasks and read-only QA/status commands.

## DISAGREEMENTS

1. None for this slice.
