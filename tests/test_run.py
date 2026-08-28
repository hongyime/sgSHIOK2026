import sys

import run


def test_run_docstring_uses_uv_managed_invocation():
    assert "Usage: uv run python run.py <task> [options]" in run.__doc__
    assert "Usage: python run.py <task> [options]" not in run.__doc__


def test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks():
    assert "Safe reports:" in run.__doc__
    assert (
        "check --freshness-only | check --geospatial-discovery-only | universe-status | p19-gap-status | p19-mcst-locations | p125-osm-status | readiness | readiness --gate-summary | batch-plan | validate"
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
    assert (
        "validate reads and validates an existing static bundle without writing, scoring, exporting or deploying."
        in run.__doc__
    )
    assert "batch-plan dry-runs batch prerequisites and policy status without scoring." not in run.__doc__
    assert "Gated pipeline tasks:" in run.__doc__
    assert (
        "ingest | lamp-overlay | network | network-debug | score | score-batch | export | "
        "export-transit | refresh-provenance | publish | onemap-probe | "
        "onemap-validation collect | onemap-outlier-replay | onemap-outlier-triage | "
        "overture-addresses | compare-targeted | geocode-universe"
        in run.__doc__
    )
    assert (
        "ingest mutates raw/ and raw/manifest.json; through run.py it requires "
        "--confirm-input-refresh"
        in run.__doc__
    )
    assert (
        "lamp-overlay writes a compact lamp-post artifact directory from existing raw data; "
        "it requires explicit --output and --confirm-lamp-overlay."
        in run.__doc__
    )
    assert (
        "network writes processed network artifacts and QA outputs; it requires "
        "--confirm-network-build after owner approval."
        in run.__doc__
    )
    assert (
        "network-debug writes compact network debug GeoJSON; it requires explicit --output and --confirm-network-debug."
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
        "export can re-export --records-dir without scoring; every export requires "
        "--confirm-export and live scoring export also requires --confirm-live-score-export."
        in run.__doc__
    )
    assert (
        "export-transit writes transit POI artifacts; it requires explicit --output and --confirm-export."
        in run.__doc__
    )
    assert (
        "onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe."
        in run.__doc__
    )
    assert (
        "onemap-validation collect calls OneMap; it requires explicit --output and --confirm-onemap-collection."
        in run.__doc__
    )
    assert (
        "onemap-outlier-replay writes a replay report after local outlier scoring; it requires explicit --output and --confirm-outlier-replay."
        in run.__doc__
    )
    assert (
        "onemap-outlier-triage writes QA queues; it requires explicit output paths and --confirm-outlier-triage."
        in run.__doc__
    )
    assert (
        "overture-addresses can read remote Overture data and write candidate evidence; it requires --confirm-overture-addresses."
        in run.__doc__
    )
    assert (
        "compare-targeted writes targeted score comparison reports; it requires explicit --output and --confirm-compare-targeted."
        in run.__doc__
    )
    assert (
        "postal-universe writes a new postal-universe parquet and summary, and "
        "--download-missing can fetch source inputs; it requires --confirm-postal-universe."
        in run.__doc__
    )
    assert (
        "geocode-universe can call OneMap and write a bounded geocode-fill parquet, "
        "summary, and cache; non-dry runs require --confirm-bounded-geocode, "
        "fresh numeric-version outputs, and an explicitly versioned geocode cache."
        in run.__doc__
    )
    assert (
        "publish deploys the static bundle; it requires --confirm-publish after owner approval."
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
    assert "refresh-provenance is fail-closed; it requires explicit --output and --confirm-refresh-provenance." in help_text
    assert "refresh-provenance refresh bundle manifest score provenance without rescoring" not in help_text
    assert (
        "batch-plan dry-runs one-attempt full-batch prerequisites and policy status "
        "without scoring; execution still requires owner approval and bounded OneMap controls."
        in help_text
    )
    assert (
        "validate reads and validates an existing static bundle without writing, scoring, exporting or deploying."
        in help_text
    )
    assert "batch-plan dry-runs batch prerequisites and policy status without scoring." not in help_text
    assert "Gated pipeline tasks:" in help_text
    assert (
        "ingest | lamp-overlay | network | network-debug | score | score-batch | export | "
        "export-transit | refresh-provenance | publish | onemap-probe | "
        "onemap-validation collect | onemap-outlier-replay | onemap-outlier-triage | "
        "overture-addresses | compare-targeted | geocode-universe"
        in help_text
    )
    assert (
        "ingest mutates raw/ and raw/manifest.json; through run.py it requires "
        "--confirm-input-refresh"
        in help_text
    )
    assert (
        "lamp-overlay writes a compact lamp-post artifact directory from existing raw data; "
        "it requires explicit --output and --confirm-lamp-overlay."
        in help_text
    )
    assert (
        "network writes processed network artifacts and QA outputs; it requires "
        "--confirm-network-build after owner approval."
        in help_text
    )
    assert (
        "network-debug writes compact network debug GeoJSON; it requires explicit --output and --confirm-network-debug."
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
        "export can re-export --records-dir without scoring; every export requires "
        "--confirm-export and live scoring export also requires --confirm-live-score-export."
        in help_text
    )
    assert (
        "export-transit writes transit POI artifacts; it requires explicit --output and --confirm-export."
        in help_text
    )
    assert (
        "onemap-probe is a network-heavy OneMap rate probe; it requires explicit --output and --confirm-onemap-probe."
        in help_text
    )
    assert (
        "onemap-validation collect calls OneMap; it requires explicit --output and --confirm-onemap-collection."
        in help_text
    )
    assert (
        "onemap-outlier-replay writes a replay report after local outlier scoring; it requires explicit --output and --confirm-outlier-replay."
        in help_text
    )
    assert (
        "onemap-outlier-triage writes QA queues; it requires explicit output paths and --confirm-outlier-triage."
        in help_text
    )
    assert (
        "overture-addresses can read remote Overture data and write candidate evidence; it requires --confirm-overture-addresses."
        in help_text
    )
    assert (
        "compare-targeted writes targeted score comparison reports; it requires explicit --output and --confirm-compare-targeted."
        in help_text
    )
    assert (
        "postal-universe writes a new postal-universe parquet and summary, and "
        "--download-missing can fetch source inputs; it requires --confirm-postal-universe."
        in help_text
    )
    assert (
        "geocode-universe can call OneMap and write a bounded geocode-fill parquet, "
        "summary, and cache; non-dry runs require --confirm-bounded-geocode, "
        "fresh numeric-version outputs, and an explicitly versioned geocode cache."
        in help_text
    )
    assert (
        "publish deploys the static bundle; it requires --confirm-publish after owner approval."
        in help_text
    )


def test_run_task_descriptions_name_published_shelter_map_bundle():
    assert run.STUBS["refresh-provenance"] == (
        "fail-closed manifest provenance refresh; requires explicit --output and "
        "--confirm-refresh-provenance"
    )
    assert run.STUBS["lamp-overlay"] == (
        "build compact lamp-post overlay artifact from existing raw source; requires "
        "explicit --output and --confirm-lamp-overlay"
    )
    assert run.STUBS["ingest"] == (
        "download changed sources to raw/ (T0.3); run.py requires --confirm-input-refresh"
    )
    assert run.STUBS["network"] == (
        "build conflated graph + QA report (T1.1); requires --confirm-network-build"
    )
    assert run.STUBS["network-debug"] == (
        "rebuild compact network debug GeoJSON from QA JSON; requires --confirm-network-debug"
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
        "requires explicit --output and --confirm-bus-arrivals"
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
        "probe Overture Addresses SG as candidate-only postal-universe evidence; "
        "requires --confirm-overture-addresses"
    )
    assert run.STUBS["onemap-validation"] == (
        "plan/evaluate OneMap validation reports; collect requires --confirm-onemap-collection"
    )
    assert run.STUBS["onemap-probe"] == (
        "network-heavy OneMap rate probe; requires explicit --output and --confirm-onemap-probe"
    )
    assert run.STUBS["compare-targeted"] == (
        "compare a targeted score report against the published shelter-map bundle; "
        "requires --confirm-compare-targeted"
    )
    assert run.STUBS["onemap-outlier-replay"] == (
        "replay OneMap validation outliers through current local scoring; "
        "requires --confirm-outlier-replay"
    )
    assert run.STUBS["onemap-outlier-triage"] == (
        "build QA queues from profiled OneMap outlier replays; requires --confirm-outlier-triage"
    )
    assert run.STUBS["candidate-audit"] == (
        "audit ranked MRT/LRT and bus candidates for selected postals; requires "
        "--confirm-candidate-audit"
    )
    assert run.STUBS["bus-connector-diagnostics"] == (
        "diagnose priority OneMap missing-bus connector cases; requires "
        "--confirm-bus-connector-diagnostics"
    )
    assert run.STUBS["batch-plan"] == (
        "dry-run one-attempt full postal geocode/scoring batch plan; execution still "
        "requires owner approval and bounded OneMap controls"
    )
    assert run.STUBS["geocode-universe"] == (
        "bounded OneMap geocode fill for source-derived postal gaps; non-dry runs "
        "require fresh numeric-version outputs and an explicitly versioned geocode cache"
    )
    assert run.STUBS["postal-universe"] == (
        "build deterministic postal-code universe candidates; requires --confirm-postal-universe"
    )
    assert run.STUBS["export"] == (
        "scores/{area}.json + geom/h3/{cell}.json + manifest (T1.5); requires "
        "--confirm-export, and live scoring requires --confirm-live-score-export"
    )
    assert run.STUBS["export-transit"] == (
        "refresh transit POIs without rescoring; requires explicit --output and --confirm-export"
    )
    assert run.STUBS["publish"] == (
        "vercel deploy --prod --archive=tgz (only deploy path); requires --confirm-publish"
    )
    assert run.STUBS["validate"] == "read-only static bundle validation; blocks publish (T1.7)"
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


def assert_task_refused_without_subprocess(monkeypatch, capsys, task, extra, *messages):
    calls = []

    def fake_run(*args, **kwargs):
        calls.append((args, kwargs))
        raise AssertionError(f"{task} should not run without confirmation")

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task(task, extra) == 2
    assert calls == []
    err = capsys.readouterr().err
    for message in messages:
        assert message in err


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


def test_run_ingest_forwards_confirm_flag_to_fetch_module(monkeypatch):
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
                "--confirm-input-refresh",
                "--source",
                "lamp_posts",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_network_requires_confirm_network_build_before_module(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "network",
        [],
        "run.py network builds processed network artifacts and QA outputs",
        "--confirm-network-build",
    )


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


def test_run_network_debug_requires_confirm_before_module(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "network-debug",
        ["--output", "qa/p742/island_debug.geojson"],
        "run.py network-debug writes compact network debug GeoJSON",
        "--confirm-network-debug",
    )


def test_run_network_debug_strips_confirm_before_module(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "network-debug",
            ["--output", "qa/p742/island_debug.geojson", "--confirm-network-debug"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.rebuild_network_debug",
                "--output",
                "qa/p742/island_debug.geojson",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_score_requires_confirm_score_run_before_module(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "score",
        [],
        "run.py score runs routed scoring even at default limits",
        "--confirm-score-run",
    )


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


def test_run_score_batch_requires_confirm_before_module(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "score-batch",
        ["--postal-universe", "processed/subset.parquet", "--output-dir", "qa/p726/scores"],
        "run.py score-batch runs routed scoring for non-dry batches",
        "--confirm-score-batch-run",
    )


def test_run_score_batch_allows_dry_run_without_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("score-batch", ["--dry-run", "--postal-universe", "processed/subset.parquet"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.score_batch",
                "--dry-run",
                "--postal-universe",
                "processed/subset.parquet",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_bus_arrivals_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "bus-arrivals",
        ["--output", "logs/bus_arrivals.jsonl"],
        "run.py bus-arrivals calls DataMall and appends local snapshot output",
        "--confirm-bus-arrivals",
    )


def test_run_task_forwards_bus_arrivals_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "bus-arrivals",
            ["--output", "logs/bus_arrivals.jsonl", "--confirm-bus-arrivals"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.bus_arrivals",
                "--output",
                "logs/bus_arrivals.jsonl",
                "--confirm-bus-arrivals",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_bus_connector_diagnostics_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "bus-connector-diagnostics",
        ["--output", "qa/p740/bus_connectors.json"],
        "run.py bus-connector-diagnostics writes diagnostic reports",
        "--confirm-bus-connector-diagnostics",
    )


def test_run_task_forwards_confirmed_bus_connector_diagnostics(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "bus-connector-diagnostics",
            [
                "--output",
                "qa/p740/bus_connectors.json",
                "--confirm-bus-connector-diagnostics",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.diagnose_bus_connectors",
                "--output",
                "qa/p740/bus_connectors.json",
                "--confirm-bus-connector-diagnostics",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_candidate_audit_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "candidate-audit",
        ["--output", "qa/p740/candidate_audit.json"],
        "run.py candidate-audit writes candidate audit reports",
        "--confirm-candidate-audit",
    )


def test_run_task_forwards_confirmed_candidate_audit(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "candidate-audit",
            ["--output", "qa/p740/candidate_audit.json", "--confirm-candidate-audit"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.audit_postal_candidates",
                "--output",
                "qa/p740/candidate_audit.json",
                "--confirm-candidate-audit",
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

    assert (
        run.run_task(
            "lamp-overlay",
            ["--output", "web/public/data/lamp_posts_v2", "--confirm-lamp-overlay"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.lamp_overlay",
                "--output",
                "web/public/data/lamp_posts_v2",
                "--confirm-lamp-overlay",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_lamp_overlay_without_confirm(monkeypatch, capsys):
    calls = []

    def fake_run(*args, **kwargs):
        calls.append((args, kwargs))
        raise AssertionError("lamp-overlay should not run without confirmation")

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("lamp-overlay", ["--output", "web/public/data/lamp_posts_v2"]) == 2

    captured = capsys.readouterr()
    assert calls == []
    assert "run.py lamp-overlay writes a compact lamp-post artifact directory" in captured.err
    assert "--confirm-lamp-overlay" in captured.err
    assert "Do not overwrite existing public-data artifacts" in captured.err


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


def test_run_task_refuses_onemap_probe_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "onemap-probe",
        ["--output", "logs/onemap_probe_v2.csv"],
        "run.py onemap-probe calls the OneMap API",
        "--confirm-onemap-probe",
    )


def test_run_task_refuses_onemap_validation_collect_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "onemap-validation",
        ["collect", "--output", "qa/p742/onemap_collect.json"],
        "run.py onemap-validation collect calls OneMap",
        "--confirm-onemap-collection",
    )


def test_run_task_allows_onemap_validation_plan_without_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("onemap-validation", ["plan", "--output", "qa/p742/onemap_plan.json"]) == 0

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.onemap_validation",
                "plan",
                "--output",
                "qa/p742/onemap_plan.json",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_onemap_outlier_replay_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "onemap-outlier-replay",
        ["--output", "qa/p742/outlier_replay.json"],
        "run.py onemap-outlier-replay writes a replay report",
        "--confirm-outlier-replay",
    )


def test_run_task_forwards_confirmed_onemap_outlier_replay(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "onemap-outlier-replay",
            ["--output", "qa/p742/outlier_replay.json", "--confirm-outlier-replay"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.replay_onemap_outliers",
                "--output",
                "qa/p742/outlier_replay.json",
                "--confirm-outlier-replay",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_onemap_outlier_triage_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "onemap-outlier-triage",
        ["--output", "qa/p742/triage.json"],
        "run.py onemap-outlier-triage writes QA queues",
        "--confirm-outlier-triage",
    )


def test_run_task_strips_onemap_outlier_triage_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "onemap-outlier-triage",
            [
                "--output",
                "qa/p742/triage.json",
                "--geojson-output",
                "qa/p742/triage.geojson",
                "--confirm-outlier-triage",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.triage_onemap_outliers",
                "--output",
                "qa/p742/triage.json",
                "--geojson-output",
                "qa/p742/triage.geojson",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_overture_addresses_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "overture-addresses",
        ["--output", "qa/p742/overture.json"],
        "run.py overture-addresses can read remote Overture data",
        "--confirm-overture-addresses",
    )


def test_run_task_forwards_overture_addresses_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "overture-addresses",
            ["--output", "qa/p742/overture.json", "--confirm-overture-addresses"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.overture_addresses",
                "--output",
                "qa/p742/overture.json",
                "--confirm-overture-addresses",
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


def test_run_task_refuses_export_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "export",
        ["--output", "web/public/data/generated_v2", "--records-dir", "processed/score_batches/demo"],
        "run.py export writes a bundle directory",
        "--confirm-export",
    )


def test_run_task_forwards_confirmed_export(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "export",
            [
                "--output",
                "web/public/data/generated_v2",
                "--records-dir",
                "processed/score_batches/demo",
                "--confirm-export",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.export",
                "export",
                "--output",
                "web/public/data/generated_v2",
                "--records-dir",
                "processed/score_batches/demo",
                "--confirm-export",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_export_transit_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "export-transit",
        ["--output", "web/public/data/transit_v2"],
        "run.py export-transit writes transit artifacts",
        "--confirm-export",
    )


def test_run_task_forwards_export_confirm_for_export_transit(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "export-transit",
            ["--output", "web/public/data/transit_v2", "--confirm-export"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.export",
                "export-transit",
                "--output",
                "web/public/data/transit_v2",
                "--confirm-export",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_refresh_provenance_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "refresh-provenance",
        ["--output", "web/public/data/generated_v2"],
        "run.py refresh-provenance mutates bundle provenance metadata",
        "--confirm-refresh-provenance",
    )


def test_run_task_forwards_refresh_provenance_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "refresh-provenance",
            ["--output", "web/public/data/generated_v2", "--confirm-refresh-provenance"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.export",
                "refresh-provenance",
                "--output",
                "web/public/data/generated_v2",
                "--confirm-refresh-provenance",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_geocode_universe_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "geocode-universe",
        [
            "--input",
            "processed/postal_universe_candidate_full_registered.parquet",
            "--output",
            "processed/postal_universe_candidate_full_registered_geocoded_v2.parquet",
        ],
        "run.py geocode-universe can call OneMap",
        "--confirm-bounded-geocode",
    )


def test_run_task_forwards_geocode_universe_args(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "geocode-universe",
            [
                "--input",
                "processed/postal_universe_candidate_full_registered_v2.parquet",
                "--output",
                "processed/postal_universe_candidate_full_registered_geocoded_v2.parquet",
                "--db",
                "raw/geocode_cache_v2.db",
                "--confirm-bounded-geocode",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.geocode_universe",
                "--input",
                "processed/postal_universe_candidate_full_registered_v2.parquet",
                "--output",
                "processed/postal_universe_candidate_full_registered_geocoded_v2.parquet",
                "--db",
                "raw/geocode_cache_v2.db",
                "--confirm-bounded-geocode",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_postal_universe_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "postal-universe",
        [
            "--mode",
            "candidate_full_registered",
            "--output",
            "processed/postal_universe_candidate_full_registered_v2.parquet",
        ],
        "run.py postal-universe writes postal-universe parquet and summary artifacts",
        "--confirm-postal-universe",
    )


def test_run_task_strips_postal_universe_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "postal-universe",
            [
                "--mode",
                "candidate_full_registered",
                "--output",
                "processed/postal_universe_candidate_full_registered_v2.parquet",
                "--confirm-postal-universe",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.postal_universe",
                "--mode",
                "candidate_full_registered",
                "--output",
                "processed/postal_universe_candidate_full_registered_v2.parquet",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_allows_geocode_universe_dry_run_without_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "geocode-universe",
            [
                "--dry-run",
                "--input",
                "processed/postal_universe_candidate_full_registered.parquet",
                "--output",
                "processed/postal_universe_candidate_full_registered_geocoded_v2.parquet",
            ],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "pipeline.geocode_universe",
                "--dry-run",
                "--input",
                "processed/postal_universe_candidate_full_registered.parquet",
                "--output",
                "processed/postal_universe_candidate_full_registered_geocoded_v2.parquet",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_compare_targeted_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "compare-targeted",
        ["--output", "qa/p742/compare.json"],
        "run.py compare-targeted writes targeted score comparison reports",
        "--confirm-compare-targeted",
    )


def test_run_task_strips_compare_targeted_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert (
        run.run_task(
            "compare-targeted",
            ["--output", "qa/p742/compare.json", "--confirm-compare-targeted"],
        )
        == 0
    )

    assert calls == [
        {
            "cmd": [
                sys.executable,
                "-m",
                "scripts.compare_targeted_scores",
                "--output",
                "qa/p742/compare.json",
            ],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]


def test_run_task_refuses_publish_without_confirm(monkeypatch, capsys):
    assert_task_refused_without_subprocess(
        monkeypatch,
        capsys,
        "publish",
        [],
        "run.py publish deploys the static bundle",
        "--confirm-publish",
    )


def test_run_task_strips_publish_confirm(monkeypatch):
    calls = []

    class FakeCompletedProcess:
        returncode = 0

    def fake_run(cmd, check, env):
        calls.append({"cmd": cmd, "check": check, "env": env})
        return FakeCompletedProcess()

    monkeypatch.setattr(run.subprocess, "run", fake_run)

    assert run.run_task("publish", ["--confirm-publish"]) == 0

    assert calls == [
        {
            "cmd": [sys.executable, "-m", "pipeline.publish"],
            "check": False,
            "env": {**run.os.environ, "PYTHONHASHSEED": "0"},
        }
    ]
