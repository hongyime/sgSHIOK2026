# P181 score-source hash policy in readiness

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
objective_read=ok
git=ok
afa958ee73fe91f6fa8fd36309f9598309ac9744
afa958ee73fe91f6fa8fd36309f9598309ac9744	refs/heads/main
```

## Change

Production readiness now reports the expected score-affecting source hash keys, present source hash keys, missing expected keys, unexpected keys, and non-score reference source hashes. This makes the `leaf_area_index` exclusion visible as release evidence without blocking verified legacy artifacts.

## Initial focused test failure

```text
____ test_bundle_score_provenance_reports_real_live_bundle_shape_as_legacy ____

tmp_path = WindowsPath('C:/Users/bryan/AppData/Local/Temp/pytest-of-bryan/pytest-2597/test_bundle_score_provenance_r0')

    def test_bundle_score_provenance_reports_real_live_bundle_shape_as_legacy(
        tmp_path: Path,
    ):
        bundle_dir = tmp_path / "generated_test"
        export_current_fingerprint_bundle(bundle_dir)
        manifest_path = bundle_dir / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        legacy_live_bundle_provenance_shape(manifest)
        write_json(manifest_path, manifest)
    
        status = bundle_score_provenance_status(bundle_dir)
    
        assert status["ok"] is True
        assert status["state"] == "legacy"
>       assert status["source_hash_count"] == 14
E       assert 13 == 14

tests\test_production_readiness.py:1021: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_production_readiness.py::test_bundle_score_provenance_reports_real_live_bundle_shape_as_legacy
1 failed, 21 passed in 70.17s (0:01:10)
```

## Focused readiness test

```text
......................                                                   [100%]
22 passed in 81.88s (0:01:21)
```

## Diff check

```text
git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
```

Exit code 0.

## Locked weights check

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P181-score-source-hash-policy-readiness.md; "exit=$LASTEXITCODE"
exit=1
```

## FINDINGS

1. The readiness legacy-bundle test used an anonymous `source_hash_count == 14` fixture; replacing it with the actual score-source policy showed the current expected score-affecting source set has 13 keys.
2. `leaf_area_index` is already excluded from scoring provenance by `SCORE_PROVENANCE_SOURCE_HASH_KEYS`, but production readiness did not expose source-hash keys or reference-source leakage explicitly.
3. The P181 change is readiness reporting and test coverage only. It does not alter source manifests, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None for this slice.
