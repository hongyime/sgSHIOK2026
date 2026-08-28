import sys

import run


def test_run_docstring_uses_uv_managed_invocation():
    assert "Usage: uv run python run.py <task> [options]" in run.__doc__
    assert "Usage: python run.py <task> [options]" not in run.__doc__


def test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks():
    assert "Safe reports:" in run.__doc__
    assert (
        "check --freshness-only | check --geospatial-discovery-only | universe-status | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan"
        in run.__doc__
    )
    assert (
        "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh."
        in run.__doc__
    )
    assert "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest." not in run.__doc__
    assert "and groups action summaries with source names." not in run.__doc__
    assert (
        "check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads, writes no manifest, and treats changed discovery URLs as new-version inputs."
        in run.__doc__
    )
    assert "check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest." not in run.__doc__
    assert "p19-gap-status reads cached P19 16 Aug 2026 public-source sample status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files." in run.__doc__
    assert "p19-gap-status reads cached P19 measurement status" not in run.__doc__
    assert "p19-mcst-locations reads existing P379 status for unvalidated P19 MCST proxy rows only; it calls no APIs and writes no files." in run.__doc__
    assert "p19-mcst-locations reads existing P379 MCST proxy probe status only" not in run.__doc__
    assert "p125-osm-status reads cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and frozen v1 universe only, reporting OSM as geometry evidence rather than the address registry; it calls no APIs and writes no files." in run.__doc__
    assert "p125-osm-status reads cached P125 Overpass output" not in run.__doc__
    assert "universe-status consolidates the cached P19 and P125 postal-universe measurements without APIs or writes; it is evidence for sizing v1 gaps, not approval to build or promote v2." in run.__doc__
    assert "readiness validates the published shelter-map bundle and release gates without scoring or deploying." in run.__doc__
    assert "readiness --gate-summary prints the same release gate verdict and warnings without the full nested report." in run.__doc__
    assert "readiness validates the current bundle and release gates without scoring or deploying." not in run.__doc__
    assert (
        "batch-plan dry-runs one-attempt full-batch prerequisites and policy status "
        "without scoring; execution still requires owner approval and bounded OneMap controls."
        in run.__doc__
    )
    assert "batch-plan dry-runs batch prerequisites and policy status without scoring." not in run.__doc__
    assert "Gated pipeline tasks:" in run.__doc__
    assert (
        "ingest | lamp-overlay | network | score | score-batch | export | "
        "export-transit | refresh-provenance | validate | publish | onemap-probe"
        in run.__doc__
    )
    assert (
        "ingest mutates raw/ and raw/manifest.json; through run.py it requires "
        "--confirm-input-refresh"
        in run.__doc__
    )
    assert (
        "network writes processed network artifacts and QA outputs; it requires "
        "--confirm-network-build after owner approval."
        in run.__doc__
    )
    assert (
        "score runs routed scoring even at its default limit; it requires "
        "--confirm-score-run after owner approval."
        in run.__doc__
    )
    assert (
        "score-batch runs routed scoring for non-dry limited batches; it requires "
        "--confirm-score-batch-run unless --full-batch uses --confirm-full-batch."
        in run.__doc__
    )
    assert (
        "export can re-export --records-dir without scoring; live scoring export "
        "requires --confirm-live-score-export."
        in run.__doc__
    )
    assert (
        "onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe."
        in run.__doc__
    )


def test_run_help_headline_does_not_flatten_all_tasks():
    help_text = run.build_parser().format_help()

    assert "usage: run.py [-h] task" in help_text
    assert "{batch-plan,bus-arrivals" not in help_text
    assert "Safe reports:" in help_text
    assert (
        "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh."
        in help_text
    )
    assert "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest." not in help_text
    assert "and groups action summaries with source names." not in help_text
    assert (
        "check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads, writes no manifest, and treats changed discovery URLs as new-version inputs."
        in help_text
    )
    assert "check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest." not in help_text
    assert "p19-gap-status reads cached P19 16 Aug 2026 public-source sample status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files." in help_text
    assert "p19-gap-status reads cached P19 measurement status" not in help_text
    assert "p19-mcst-locations reads existing P379 status for unvalidated P19 MCST proxy rows only; it calls no APIs and writes no files." in help_text
    assert "p19-mcst-locations reads existing P379 MCST proxy probe status only" not in help_text
    assert "p125-osm-status reads cached P125 20 Aug 2026 Overpass addr:postcode coverage cross-check and frozen v1 universe only, reporting OSM as geometry evidence rather than the address registry; it calls no APIs and writes no files." in help_text
    assert "p125-osm-status reads cached P125 Overpass output" not in help_text
    assert "universe-status consolidates the cached P19 and P125 postal-universe measurements without APIs or writes; it is evidence for sizing v1 gaps, not approval to build or promote v2." in help_text
    assert "readiness validates the published shelter-map bundle and release gates without scoring or deploying." in help_text
    assert "readiness --gate-summary prints the same release gate verdict and warnings without the full nested report." in help_text
    assert "readiness validates the current bundle and release gates without scoring or deploying." not in help_text
    assert "refresh-provenance is fail-closed; direct pipeline.export invocation must name --output explicitly." in help_text
    assert "refresh-provenance refresh bundle manifest score provenance without rescoring" not in help_text
    assert (
        "batch-plan dry-runs one-attempt full-batch prerequisites and policy status "
        "without scoring; execution still requires owner approval and bounded OneMap controls."
        in help_text
    )
    assert "batch-plan dry-runs batch prerequisites and policy status without scoring." not in help_text
    assert "Gated pipeline tasks:" in help_text
    assert (
        "ingest | lamp-overlay | network | score | score-batch | export | "
        "export-transit | refresh-provenance | validate | publish | onemap-probe"
        in help_text
    )
    assert (
        "ingest mutates raw/ and raw/manifest.json; through run.py it requires "
        "--confirm-input-refresh"
        in help_text
    )
    assert (
        "network writes processed network artifacts and QA outputs; it requires "
        "--confirm-network-build after owner approval."
        in help_text
    )
    assert (
        "score runs routed scoring even at its default limit; it requires "
        "--confirm-score-run after owner approval."
        in help_text
    )
    assert (
        "score-batch runs routed scoring for non-dry limited batches; it requires "
        "--confirm-score-batch-run unless --full-batch uses --confirm-full-batch."
        in help_text
    )
    assert (
        "export can re-export --records-dir without scoring; live scoring export "
        "requires --confirm-live-score-export."
        in help_text
    )
    assert (
        "onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe."
        in help_text
    )


def test_run_task_descriptions_name_published_shelter_map_bundle():
    assert run.STUBS["refresh-provenance"] == (
        "fail-closed manifest provenance refresh; direct pipeline.export invocation must "
        "name --output explicitly"
    )
    assert run.STUBS["ingest"] == (
        "download changed sources to raw/ (T0.3); run.py requires --confirm-input-refresh"
    )
    assert run.STUBS["network"] == (
        "build conflated graph + QA report (T1.1); requires --confirm-network-build"
    )
    assert run.STUBS["score"] == (
        "apply pipeline/config/weights.yaml (T1.4); requires --confirm-score-run"
    )
    assert run.STUBS["score-batch"] == (
        "resumable postal scoring batch runner; non-dry limited runs require explicit "
        "--output-dir and --confirm-score-batch-run"
    )
    assert run.STUBS["bus-arrivals"] == (
        "collect local LTA bus-arrival snapshots for future reliability scoring; "
        "requires explicit --output"
    )
    assert run.STUBS["p19-gap-status"] == (
        "read-only status, evidence split, missing rows, MCST proxy probe and cache ages "
        "for cached P19 16 Aug 2026 public-source sample"
    )
    assert run.STUBS["p19-mcst-locations"] == (
        "read-only status for the cached P379 OneMap location probe of "
        "unvalidated P19 MCST proxy rows"
    )
    assert run.STUBS["p125-osm-status"] == (
        "read-only status for cached P125 20 Aug 2026 Overpass addr:postcode "
        "coverage cross-check and registry policy"
    )
    assert run.STUBS["universe-status"] == (
        "read-only consolidated status for cached P19 and P125 postal-universe measurements"
    )
    assert run.STUBS["overture-addresses"] == (
        "probe Overture Addresses SG as candidate-only postal-universe evidence, "
        "not scoring or registry approval"
    )
    assert run.STUBS["onemap-probe"] == (
        "network-heavy OneMap rate probe; requires explicit --output and --confirm-onemap-probe"
    )
    assert run.STUBS["compare-targeted"] == (
        "compare a targeted score report against the published shelter-map bundle"
    )
    assert run.STUBS["candidate-audit"] == (
        "audit ranked MRT/LRT and bus candidates for selected postals; requires "
        "--confirm-candidate-audit"
    )
    assert run.STUBS["batch-plan"] == (
        "dry-run one-attempt full postal geocode/scoring batch plan; execution still "
        "requires owner approval and bounded OneMap controls"
    )
    assert run.STUBS["geocode-universe"] == (
        "bounded OneMap geocode fill for source-derived postal gaps; non-dry runs "
        "require fresh numeric-version outputs"
    )
    assert run.STUBS["export"] == (
        "scores/{area}.json + geom/h3/{cell}.json + manifest (T1.5); live scoring "
        "requires --confirm-live-score-export"
    )
    assert "compare a targeted score report against the active bundle" not in run.STUBS.values()


def test_run_task_sets_pythonhashseed_for_module_subprocess(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setenv("PYTHONHASHSEED", "random")
    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("test", ["tests/test_run.py"]) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "pytest", "tests/test_run.py"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_check_requires_safe_report_flag(monkeypatch, capsys):
    calls = []

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        raise AssertionError("bare run.py check must not reach pipeline.fetch")

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("check", []) == 2

    assert calls == []
    err = capsys.readouterr().err
    assert "run.py check requires exactly one safe report flag" in err
    assert "Bare check probes upstream URLs and is not a zero-mutation report" in err


def test_run_check_allows_freshness_only_report(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("check", ["--freshness-only"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.fetch",
                "check",
                "--freshness-only",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_check_allows_geospatial_discovery_only_report(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("check", ["--geospatial-discovery-only", "--source", "covered_linkway"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.fetch",
                "check",
                "--geospatial-discovery-only",
                "--source",
                "covered_linkway",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_check_rejects_ambiguous_safe_report_flags(monkeypatch, capsys):
    calls = []

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        raise AssertionError("ambiguous run.py check must not reach pipeline.fetch")

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("check", ["--freshness-only", "--geospatial-discovery-only"]) == 2

    assert calls == []
    assert "requires exactly one safe report flag" in capsys.readouterr().err


def test_run_ingest_requires_confirm_input_refresh(monkeypatch, capsys):
    calls = []

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        raise AssertionError("unconfirmed run.py ingest must not reach pipeline.fetch")

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("ingest", []) == 2

    assert calls == []
    err = capsys.readouterr().err
    assert "run.py ingest mutates raw/ and raw/manifest.json" in err
    assert "--confirm-input-refresh" in err
    assert "Do not use ingest to repair frozen-v1 hash mismatches." in err


def test_run_ingest_strips_runner_confirm_flag_before_fetch(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("ingest", ["--confirm-input-refresh", "--source", "lamp_posts"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.fetch",
                "ingest",
                "--source",
                "lamp_posts",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_network_requires_confirm_network_build_via_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 2

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("network", []) == 2

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "pipeline.network"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_network_forwards_confirm_network_build(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("network", ["--area", "island", "--confirm-network-build"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.network",
                "--area",
                "island",
                "--confirm-network-build",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_score_requires_confirm_score_run_via_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 1

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("score", []) == 1

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "pipeline.scoring_integration"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_score_forwards_confirm_score_run(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("score", ["--postal", "560234", "--confirm-score-run"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.scoring_integration",
                "--postal",
                "560234",
                "--confirm-score-run",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_score_batch_forwards_confirm_score_batch_run(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "score-batch",
            [
                "--postal-universe",
                "processed/subset.parquet",
                "--output-dir",
                "qa/p726/scores",
                "--confirm-score-batch-run",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.score_batch",
                "--postal-universe",
                "processed/subset.parquet",
                "--output-dir",
                "qa/p726/scores",
                "--confirm-score-batch-run",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_p19_gap_status_as_read_only_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("p19-gap-status", []) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.analysis.p19_universe_gap_measurement",
                "--cache-status-only",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_lamp_overlay_as_gated_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("lamp-overlay", ["--output", "web/public/data/lamp_posts_v2"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.lamp_overlay",
                "--output",
                "web/public/data/lamp_posts_v2",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_p19_mcst_location_probe_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("p19-mcst-locations", []) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.analysis.p19_mcst_missing_locations",
                "--cache-status-only",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_p125_osm_status_as_read_only_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("p125-osm-status", []) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.analysis.p125_osm_postcode_status",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_onemap_probe_as_gated_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task(
        "onemap-probe",
        ["--output", "logs/onemap_probe_v2.csv", "--confirm-onemap-probe"],
    ) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.probe_onemap",
                "--output",
                "logs/onemap_probe_v2.csv",
                "--confirm-onemap-probe",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_universe_status_as_read_only_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("universe-status", []) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.analysis.universe_measurement_status",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_exposes_readiness_report_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("readiness", []) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "scripts.production_readiness"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_forwards_readiness_gate_summary_flag(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("readiness", ["--gate-summary"]) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "scripts.production_readiness", "--gate-summary"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]
