# P994 README Coverage Wording

## Working Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## Scope

```text
README and durable decision-log wording alignment for locked-score coverage.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, protected payload mutation, or weights.yaml change was performed.
```

## Initial Focused Test

```text
.F..                                                                     [100%]
================================== FAILURES ===================================
______________ test_readme_documents_local_lamp_overlay_artifact ______________

    def test_readme_documents_local_lamp_overlay_artifact() -> None:
        text = README.read_text(encoding="utf-8")
        normalized = compact(text)
    
        assert "## Local data artifacts" in text
        assert "live shelter-map bundle remains configured" in normalized
        assert "live score bundle remains configured" not in normalized
        assert "`web/public/data/generated_20260805_prefer_scored_routed/`" in normalized
        assert "locked-score coverage for 95,157 of 124,443 records" in normalized
        assert "95,157 full locked scores out of 124,443 records" not in normalized
        assert "95,157 full scores out of 124,443 records" not in normalized
        assert "29,286 records, 23.5% or roughly a quarter, do not show a full locked score" in normalized
        assert "29,286 records, roughly a quarter, do not show a full locked score" not in normalized
        assert "partial shelter-map evidence" in normalized
        assert "beyond locked transit range" in normalized
        assert "beyond current transit range" not in normalized
>       assert "awaiting scoring" in normalized
E       AssertionError: assert 'awaiting scoring' in '# S.H.I.O.K. Shelter Map A free, non-commercial civic web app for Singapore postal records that answers: if I move he...ENSE](LICENSE) and [NOTICE](NOTICE). Source data and map attribution are recorded in [ATTRIBUTION.md](ATTRIBUTION.md).'

tests\test_readme.py:84: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_readme.py::test_readme_documents_local_lamp_overlay_artifact
1 failed, 3 passed in 1.52s
```

## Final Verification

```text
....                                                                     [100%]
4 passed in 0.93s
```

```text
repo_integrity=ok
```

```text
git diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. README still described the live bundle as having `95,157 full locked scores out of 124,443 records`, while the browser now frames the same manifest-derived fact as `Locked-score coverage`.
2. README now says `locked-score coverage for 95,157 of 124,443 records` and preserves the exact 29,286 missing-full-score count plus the partial/beyond-range/not-published breakdown.
3. The focused README test exposed a stale assertion expecting `awaiting scoring`; README already used the safer `lack published locked scores` wording, so the test was corrected to guard against queue-like wording.

## DISAGREEMENTS

1. I did not change old decision-log entries that quote historical wording. The new P994 entry supersedes them without rewriting history.
2. I did not broaden this into browser copy or scoring work; the browser formatter was already aligned in P993.
