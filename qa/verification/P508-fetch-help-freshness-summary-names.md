# P508 fetch help freshness summary names

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-22

## Change

The lower-level `pipeline.fetch check --help` text now states that `--freshness-only` writes no manifest and keeps source names in grouped action summaries.

## Command output

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py -q
F....................                                                    [100%]
================================== FAILURES ===================================
___________ test_fetch_check_help_names_freshness_summary_contract ____________

capsys = <_pytest.capture.CaptureFixture object at 0x00000209B6472210>

    def test_fetch_check_help_names_freshness_summary_contract(
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        with pytest.raises(SystemExit) as excinfo:
            fetch.main(["check", "--help"])
    
        assert excinfo.value.code == 0
        out = capsys.readouterr().out
>       assert "read raw/manifest.json and report source freshness" in out
E       AssertionError: assert 'read raw/manifest.json and report source freshness' in 'usage: pytest [-h] [--freshness-only] [--geospatial-discovery-only]\n              [--source SOURCE]\n              {...anifest.\n  --source SOURCE       Restrict to one source key. Can be passed multiple\n                        times.\n'

tests\test_fetch.py:29: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_fetch.py::test_fetch_check_help_names_freshness_summary_contract
1 failed, 20 passed in 3.31s
```

```text
PS C:\sgSHIOK2026> uv run python -m pipeline.fetch check --help
usage: fetch.py [-h] [--freshness-only] [--geospatial-discovery-only]
                [--source SOURCE]
                {check,ingest}

Fetch/check upstream SHIOK datasets.

positional arguments:
  {check,ingest}

options:
  -h, --help            show this help message and exit
  --freshness-only      For check: read raw/manifest.json and report source
                        freshness without probing upstream URLs, writing the
                        manifest, or omitting source names from grouped action
                        summaries.
  --geospatial-discovery-only
                        For check: resolve DataMall geospatial listing URLs
                        without downloading payloads or writing the manifest.
  --source SOURCE       Restrict to one source key. Can be passed multiple
                        times.
```

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_fetch.py -q
.....................                                                    [100%]
21 passed in 3.17s
```

## FINDINGS

1. `run.py check --help` delegates to `pipeline.fetch check --help`, and that lower-level help still omitted the no-manifest and named-summary freshness contract.
2. The first added test failed only because argparse wrapped the help text; the assertion was changed to normalize whitespace, not to weaken the behavior under test.
3. This is lower-level CLI help/test coverage only. It does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

## DISAGREEMENTS

1. None.
