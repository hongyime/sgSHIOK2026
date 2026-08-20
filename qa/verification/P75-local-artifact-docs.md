# P75 Local Data Artifact Documentation Evidence

## Startup Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Current Head At Start

```text
978556a fix: show night-lighting overlay status
73052ce fix: disclose night-lighting source status
21fc772 fix: guard night-lighting overlay readiness
749926d fix: load env for batch-plan credential readiness
3a8ef33 fix: report API credential readiness
1a358f4 docs: align MCST proxy terminology
978556a820c6df5ce65726f4d79c0ee21d620e53
978556a820c6df5ce65726f4d79c0ee21d620e53	refs/heads/main
```

## Focused README Test

First run failed because the test asserted Markdown prose without normalizing line wrapping:

```text
F.                                                                       [100%]
================================== FAILURES ===================================
________________ test_readme_documents_universe_source_policy _________________

    def test_readme_documents_universe_source_policy() -> None:
        text = README.read_text(encoding="utf-8")

        assert "## Universe status" in text
        assert "124,443-record source-derived set" in text
>       assert "8 missing rows out of 976 HDB completion and MCST proxy rows" in text
E       AssertionError: assert '8 missing rows out of 976 HDB completion and MCST proxy rows' in '# S.H.I.O.K. Index\n\nA free, non-commercial civic web app for Singapore postal records that answers:\nif I move here...E](LICENSE) and [NOTICE](NOTICE). Source data and map\nattribution are recorded in [ATTRIBUTION.md](ATTRIBUTION.md).\n'

tests\test_readme.py:12: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_readme.py::test_readme_documents_universe_source_policy - A...
1 failed, 1 passed in 1.87s
```

The test now normalizes whitespace before checking prose phrases.

Command:

```text
uv run pytest tests/test_readme.py -q
```

Output:

```text
..                                                                       [100%]
2 passed in 1.03s
```

## Evidence Ignore Check

Command:

```text
git check-ignore -v qa/verification/P75-local-artifact-docs.md; Write-Output "ignore_exit=$LASTEXITCODE"
```

Output:

```text
ignore_exit=1
```

## Repo Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Diff And Weight Guard

Command:

```text
git diff --check; Write-Output "diff_check_exit=$LASTEXITCODE"; git diff -- pipeline/config/weights.yaml; Write-Output "weights_exit=$LASTEXITCODE"
```

Output:

```text
diff_check_exit=0
weights_exit=0
```

## FINDINGS

1. README documented the frozen universe policy but did not tell a fresh clone or release handoff that the night-lighting layer depends on the separate gitignored local `web/public/data/lamp_posts_v1/` artifact.
2. The new README section names the active score bundle, the lamp overlay artifact path, the 700 H3-r8 tile files, 126,144 lamp-post points, source last modified 7 Jul 2026, and the production-readiness check to run before publish.
3. The new README regression test normalizes Markdown whitespace so line wrapping does not create false failures.

## DISAGREEMENTS

1. None.
