# P724 run.py ingest confirmation guard

## startup root

Command:

```powershell
$ErrorActionPreference='Stop'; if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { Set-Location 'C:\sgSHIOK2026' }; $root=(Get-Location).Path; $hostName=$env:COMPUTERNAME; if ($root -ne 'C:\sgSHIOK2026') { throw "Wrong root: $root" }; Write-Output "ROOT=$root"; Write-Output "HOST=$hostName"
```

Output:

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## head and remote before change

Command:

```powershell
git rev-parse HEAD
git ls-remote origin main
```

Output:

```text
515739d51bc077df07ebca1ea89206775a3800a6
515739d51bc077df07ebca1ea89206775a3800a6	refs/heads/main
```

## evidence path ignore check

Command:

```powershell
git check-ignore -v qa/verification/P724-run-ingest-confirmation.md; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## inspected command surface

Command:

```powershell
rg -n "def main|subparsers|add_parser|ingest|confirm|output|manifest|raw" C:\sgSHIOK2026\pipeline\fetch.py C:\sgSHIOK2026\tests\test_fetch.py C:\sgSHIOK2026\tests\test_run.py
```

Relevant output:

```text
C:\sgSHIOK2026\pipeline\fetch.py:147:def save_manifest(manifest: dict[str, Any]) -> None:
C:\sgSHIOK2026\pipeline\fetch.py:149:    manifest["generated_at"] = datetime.now(UTC).isoformat()
C:\sgSHIOK2026\pipeline\fetch.py:154:        json.dump(manifest, f, indent=2, sort_keys=True)
C:\sgSHIOK2026\pipeline\fetch.py:1037:def run_ingest(sources: dict[str, Any]) -> int:
C:\sgSHIOK2026\pipeline\fetch.py:1038:    manifest = load_manifest()
C:\sgSHIOK2026\pipeline\fetch.py:1039:    manifest_sources: dict[str, Any] = manifest.setdefault("sources", {})
C:\sgSHIOK2026\pipeline\fetch.py:1081:                manifest_sources[key] = new_entry
C:\sgSHIOK2026\pipeline\fetch.py:1083:                    f"[{key}] Ingested {name} -> raw/{sha256[:8]}.../{key}.json ({len(records)} records)"
C:\sgSHIOK2026\pipeline\fetch.py:1330:    save_manifest(manifest)
C:\sgSHIOK2026\pipeline\fetch.py:1340:def main(argv: list[str] | None = None) -> int:
C:\sgSHIOK2026\pipeline\fetch.py:1342:    parser.add_argument("action", choices=["check", "ingest"])
C:\sgSHIOK2026\pipeline\fetch.py:1388:    elif args.action == "ingest":
C:\sgSHIOK2026\pipeline\fetch.py:1395:        return run_ingest(sources)
```

## direct refusal proof

Command:

```powershell
uv run python run.py ingest; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
run.py ingest mutates raw/ and raw/manifest.json; pass --confirm-input-refresh only after approval to create a new numbered input version. Do not use ingest to repair frozen-v1 hash mismatches.
exit_code=2
```

## tests and checks

Command:

```powershell
uv run pytest tests/test_run.py -q
```

Output:

```text
...................                                                      [100%]
19 passed in 5.36s
```

Command:

```powershell
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
509 tests collected in 24.76s
```

Command:

```powershell
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

Command:

```powershell
git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

Output:

```text
```

## diff stat

Command:

```powershell
git diff --stat
```

Output:

```text
 run.py            | 23 +++++++++++++++++----
 tests/test_run.py | 61 +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 80 insertions(+), 4 deletions(-)
```

## findings

1. `run.py ingest` previously forwarded directly to `pipeline.fetch ingest`, whose ingest path writes `raw/` content and updates `raw/manifest.json`.
2. `run.py ingest` now fails closed unless the caller passes `--confirm-input-refresh`; the runner strips that confirmation flag before invoking `pipeline.fetch`, so the underlying fetch CLI remains unchanged.
3. Test collection moved from 507 to 509 because this phase adds two `run.py` confirmation-guard tests.

## disagreements

1. None.
