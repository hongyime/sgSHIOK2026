from __future__ import annotations

import argparse
import json
import os
import re
import stat
import subprocess
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from uuid import uuid4

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WEB_DIR = PROJECT_ROOT / "web"
DEFAULT_VERCEL_SCOPE = "theprawnvercel"
DEFAULT_VERCEL_PROJECT = "sgshiok"
OVERLAY_BUNDLE = "lamp_posts_v1"


def command_name(name: str) -> str:
    return f"{name}.cmd" if os.name == "nt" and name in {"npm", "vercel"} else name


def command_environment() -> dict[str, str]:
    # No caller data overrides, NODE_OPTIONS, lifecycle hooks or private web .env.
    allowed = {
        "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP",
        "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "VERCEL_TOKEN",
    }
    env = {key: value for key, value in os.environ.items() if key.upper() in allowed}
    env.update(NEXT_TELEMETRY_DISABLED="1", CI="1")
    return env


def run_command(cmd: list[str], cwd: Path, *, timeout: int = 600) -> dict[str, Any]:
    from scripts.release_process import run_owned_command

    try:
        return run_owned_command(cmd, cwd, timeout=timeout, env=command_environment())
    except subprocess.TimeoutExpired:
        return {"returncode": None, "stdout": "", "stderr": "", "ok": False, "error": "command_timeout"}
    except OSError:
        return {"returncode": None, "stdout": "", "stderr": "", "ok": False, "error": "command_unavailable"}


def command_status(result: dict[str, Any]) -> dict[str, Any]:
    # Auth and CLI output are not evidence of readiness and may contain credentials.
    return {key: result.get(key) for key in ("ok", "returncode", "error", "cleanup_complete")}


def scoped_path(path: Path, root: Path) -> Path:
    if not path.is_absolute() or path != Path(os.path.abspath(path)):
        raise ValueError("absolute normalized repository paths required")
    if not path.is_relative_to(root):
        raise ValueError("path outside repository")
    for current in (root, *reversed(path.relative_to(root).parents)):
        # The relative-parent loop below is checked in absolute form.
        absolute = current if current.is_absolute() else root / current
        if absolute.exists() or absolute.is_symlink():
            info = absolute.lstat()
            if absolute.is_symlink() or getattr(info, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT:
                raise ValueError("linked repository path refused")
    if path.exists() or path.is_symlink():
        info = path.lstat()
        if path.is_symlink() or getattr(info, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT:
            raise ValueError("linked repository path refused")
    return path


def committed_pointer(root: Path) -> tuple[str, bytes]:
    revision = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD^{commit}"], cwd=root,
        check=True, capture_output=True, timeout=30,
    ).stdout.decode("ascii").strip()
    if not re.fullmatch(r"[0-9a-f]{40,64}", revision):
        raise ValueError("invalid committed revision")
    pointer = subprocess.run(
        ["git", "show", f"{revision}:web/data-bundle.json"], cwd=root,
        check=True, capture_output=True, timeout=30,
    ).stdout
    return revision, pointer


def release_selection(input_dir: Path | None, web_dir: Path) -> dict[str, Any]:
    root = PROJECT_ROOT
    if scoped_path(web_dir, root) != root / "web":
        raise ValueError("release must use the repository web directory")
    pointer_path = scoped_path(web_dir / "data-bundle.json", root)
    revision, pointer_bytes = committed_pointer(root)
    if pointer_path.read_bytes() != pointer_bytes:
        raise ValueError("web/data-bundle.json differs from committed source")
    pointer = json.loads(pointer_bytes)
    bundle = pointer.get("bundle") if isinstance(pointer, dict) else None
    if not isinstance(bundle, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", bundle):
        raise ValueError("invalid pinned bundle")
    data = web_dir / "public/data" / bundle
    if input_dir is not None and scoped_path(input_dir, root) != data:
        raise ValueError("frontend-only release requires the pinned bundle; data activation is separate")
    for name, expected in (("SHIOK_DATA_BUNDLE", bundle), ("NEXT_PUBLIC_DATA_BASE", f"/data/{bundle}/")):
        if os.environ.get(name) not in (None, "", expected):
            raise ValueError(f"conflicting {name} override")
    overlay = web_dir / "public/data" / OVERLAY_BUNDLE
    for directory, role in ((data, "main bundle"), (overlay, "lamp overlay")):
        manifest = scoped_path(directory / "manifest.json", root)
        if not manifest.is_file():
            raise ValueError(f"missing {role} manifest")
    return {"revision": revision, "bundle": bundle, "data": data, "overlay": overlay}


def target() -> tuple[str, str]:
    scope = os.environ.get("VERCEL_SCOPE", DEFAULT_VERCEL_SCOPE)
    project = os.environ.get("VERCEL_PROJECT", DEFAULT_VERCEL_PROJECT)
    if not all(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", value) for value in (scope, project)):
        raise ValueError("invalid explicit Vercel target")
    return scope, project


def deploy_command(source_dir: Path, *, project_id: str | None = None, bundle: str | None = None) -> list[str]:
    scope, project = target()
    command = [
        command_name("vercel"), "deploy", str(source_dir), "--prod", "--archive=tgz",
        "--yes", "--no-wait", "--scope", scope, "--project", project_id or project,
        "--local-config", str(source_dir / "web/vercel.json"),
    ]
    if bundle is not None:
        for key, value in {
            "SHIOK_DATA_BUNDLE": bundle, "NEXT_PUBLIC_DATA_BASE": f"/data/{bundle}/",
            "NEXT_PUBLIC_LAMP_OVERLAY_BASE": f"/data/{OVERLAY_BUNDLE}/", "NODE_OPTIONS": "",
        }.items():
            command.extend(["--build-env", f"{key}={value}"])
    return command


def deploy_compressed_json_only(relative_path: Path) -> bool:
    parts = relative_path.parts
    if len(parts) < 2 or relative_path.suffix != ".json":
        return False
    return (
        parts[0] == "scores" or parts[:2] == ("geom", "h3")
        or parts[:2] == ("geom", "postal-prefix")
        or parts in {("geom", "index.json"), ("geom", "postal-index.json")}
        or parts[:2] == ("transit", "h3") or parts == ("transit", "pois.json")
    )


def prepare_vercel_source(web_dir: Path, data_dir: Path, *, revision: str) -> dict[str, Any]:
    from scripts.release_staging import prepare_release_stage

    stage = PROJECT_ROOT / "tmp" / f"vercel_source_{uuid4().hex}"
    return prepare_release_stage(
        PROJECT_ROOT, data_dir, stage_dir=stage,
        overlay_dir=web_dir / "public/data" / OVERLAY_BUNDLE, revision=revision,
    )


def verify_stage(stage: Path, expected_sha256: str) -> dict[str, Any]:
    from scripts.release_staging import verify_release_stage

    result = verify_release_stage(PROJECT_ROOT, stage, expected_manifest_sha256=expected_sha256)
    return {**result, "ok": result.get("status") == "verified_not_deployed"}


def validate_stage(stage: Path, bundle: str) -> dict[str, Any]:
    # Import only on explicit preparation. These validators read, never export.
    from pipeline.export import validate_static_artifacts
    from scripts.production_readiness import lamp_overlay_artifact_status

    valid, static_report = validate_static_artifacts(input_dir=stage / "web/public/data" / bundle)
    overlay_report = lamp_overlay_artifact_status(web_dir=stage / "web")
    return {"ok": valid and overlay_report.get("ok") is True, "static": static_report, "overlay": overlay_report}


def check_build_dependencies(web_dir: Path) -> None:
    for relative in ("node_modules/next/dist/bin/next", "node_modules/vitest/vitest.mjs"):
        if not (web_dir / relative).is_file():
            raise ValueError("installed build/test dependencies missing; installation requires separate approval")


def link_build_dependencies(web_dir: Path, stage: Path) -> None:
    link = stage / "web/node_modules"
    if link.exists() or link.is_symlink():
        raise ValueError("staging dependency path already exists")
    # A missing symlink privilege fails closed; never copy or install dependencies.
    link.symlink_to(web_dir / "node_modules", target_is_directory=True)


def report_base(mode: str) -> dict[str, Any]:
    return {
        "ok": False, "mode": mode, "state": "not_started", "checks": {}, "errors": [],
        "ready_to_submit": False, "deploy_executed": False, "production_smoke_verified": False,
    }


def require_check(report: dict[str, Any], name: str, result: dict[str, Any]) -> None:
    report["checks"][name] = result
    if result.get("ok") is not True:
        raise ValueError(f"{name} failed")


def verify_pinned_stage(report: dict[str, Any], name: str, stage: Path) -> None:
    result = verify_stage(stage, report["release_manifest_sha256"])
    if result.get("releaseManifestSha256") != report["release_manifest_sha256"]:
        result = {**result, "ok": False, "error": "release_ledger_changed"}
    require_check(report, name, result)


def publish_preflight(
    input_dir: Path | None = None, web_dir: Path = WEB_DIR, *,
    run_external_checks: bool = False, confirm_preparation: bool = False,
) -> tuple[bool, dict[str, Any]]:
    report = report_base("preflight")
    if run_external_checks and not confirm_preparation:
        report.update(state="confirmation_required", errors=["preparation requires --confirm-preparation"])
        return False, report
    try:
        selection = release_selection(input_dir, web_dir)
        scope, project = target()
        report.update(
            source_revision=selection["revision"], bundle=selection["bundle"],
            overlay=OVERLAY_BUNDLE, target={"scope": scope, "project": project},
        )
        if not run_external_checks:
            report.update(ok=True, state="plan_only")
            return True, report
        report["failed_step"] = "dependencies"
        check_build_dependencies(web_dir)
        report["failed_step"] = "staging"
        prepared = prepare_vercel_source(web_dir, selection["data"], revision=selection["revision"])
        stage = Path(prepared["stageRoot"])
        ledger_hash = prepared["releaseManifestSha256"]
        if not isinstance(ledger_hash, str) or not re.fullmatch(r"[a-f0-9]{64}", ledger_hash):
            raise ValueError("missing preparation ledger identity")
        report["release_manifest_sha256"] = ledger_hash
        report["deploy_source_dir"] = str(stage)
        report["failed_step"] = "input_identity"
        verify_pinned_stage(report, "input_identity", stage)
        report["failed_step"] = "artifact_validation"
        require_check(report, "artifact_validation", validate_stage(stage, selection["bundle"]))
        report["failed_step"] = "npm_audit"
        audit = run_command([command_name("npm"), "audit", "--json", "--ignore-scripts"], cwd=stage / "web")
        try:
            total = json.loads(audit.get("stdout") or "{}")["metadata"]["vulnerabilities"]["total"]
        except (ValueError, KeyError, TypeError):
            total = None
        require_check(report, "npm_audit", {
            **command_status(audit), "ok": audit.get("ok") is True and type(total) is int and total == 0,
            "vulnerability_count": total,
        })
        report["failed_step"] = "dependency_link"
        link_build_dependencies(web_dir, stage)
        report["failed_step"] = "web_tests"
        require_check(report, "web_tests", command_status(run_command(
            [command_name("node"), str(stage / "web/scripts/test-web.mjs")], cwd=stage / "web",
        )))
        report["failed_step"] = "next_build"
        require_check(report, "next_build", command_status(run_command(
            [command_name("node"), str(web_dir / "node_modules/next/dist/bin/next"), "build"],
            cwd=stage / "web", timeout=1800,
        )))
        report["failed_step"] = "post_build_identity"
        verify_pinned_stage(report, "post_build_identity", stage)
        report.pop("failed_step", None)
        report.update(ok=True, state="prepared", ready_to_submit=False)
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.SubprocessError) as exc:
        report.update(ok=False, state="blocked_before_submission", errors=[str(exc)])
    return report["ok"], report


def deployment_url(output: str) -> str:
    value = output.strip()
    parts = urlsplit(value)
    if (
        parts.scheme != "https" or not parts.hostname or not parts.hostname.endswith(".vercel.app")
        or parts.username or parts.password or parts.port is not None
        or parts.path not in ("", "/") or parts.query or parts.fragment
        or not re.fullmatch(r"[A-Za-z0-9-]+\.vercel\.app", parts.hostname)
    ):
        raise ValueError("submission returned no exact deployment URL; do not resubmit automatically")
    return f"https://{parts.hostname}"


def expected_target_ids() -> tuple[str, str]:
    project_id = os.environ.get("VERCEL_PROJECT_ID", "")
    team_id = os.environ.get("VERCEL_ORG_ID", "")
    if not re.fullmatch(r"prj_[A-Za-z0-9]+", project_id) or not re.fullmatch(r"team_[A-Za-z0-9]+", team_id):
        raise ValueError("deployment requires reviewed VERCEL_PROJECT_ID and VERCEL_ORG_ID; no project will be created")
    return project_id, team_id


def remote_configuration(bundle: str, cwd: Path, project_id: str, team_id: str) -> dict[str, Any]:
    scope, project_name = target()

    def read(path: str) -> dict[str, Any]:
        response = run_command(
            [command_name("vercel"), "api", path, "--method", "GET", "--raw", "--scope", scope],
            cwd=cwd, timeout=60,
        )
        if response.get("ok") is not True:
            raise ValueError("authenticated project configuration unreadable; no deployment submitted")
        payload = json.loads(response.get("stdout") or "null")
        if not isinstance(payload, dict):
            raise ValueError("unsupported project configuration response")
        return payload

    project = read(f"/v9/projects/{project_id}")
    required = {"id": project_id, "accountId": team_id, "name": project_name, "rootDirectory": "web", "framework": "nextjs"}
    changed = [key for key, expected in required.items() if project.get(key) != expected]
    if "outputDirectory" not in project or project["outputDirectory"] is not None:
        changed.append("outputDirectory")
    if project.get("commandForIgnoringBuildStep") not in (None, ""):
        changed.append("commandForIgnoringBuildStep")
    if changed:
        raise ValueError("project configuration mismatch: " + ", ".join(changed))
    response = read(f"/v10/projects/{project_id}/env")
    entries = response.get("envs")
    if not isinstance(entries, list):
        raise ValueError("production environment metadata missing")
    pagination = response.get("pagination")
    if "pagination" in response and (
        not isinstance(pagination, dict) or "next" not in pagination or pagination["next"] is not None
    ):
        raise ValueError("environment metadata pagination is incomplete or unsupported")
    hidden = response.get("hiddenProductionEnvCount", 0)
    if type(hidden) is not int or hidden != 0:
        raise ValueError("production environment metadata is hidden or unreadable")
    required_env = {
        "SHIOK_DATA_BUNDLE": bundle, "NEXT_PUBLIC_DATA_BASE": f"/data/{bundle}/",
        "NEXT_PUBLIC_LAMP_OVERLAY_BASE": f"/data/{OVERLAY_BUNDLE}/",
        "NODE_OPTIONS": "",
    }
    checked = set()
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("key"), str):
            raise ValueError("malformed production environment metadata")
        key = entry["key"]
        if key not in required_env:
            continue
        environments = entry.get("target")
        if isinstance(environments, str):
            environments = [environments]
        if not isinstance(environments, list) or not environments or any(
            value not in ("production", "preview", "development") for value in environments
        ):
            raise ValueError(f"unknown environment scope for {key}")
        if "production" not in environments:
            continue
        if (
            key in checked or entry.get("type") != "plain" or entry.get("value") != required_env[key]
            or entry.get("gitBranch") not in (None, "") or entry.get("customEnvironmentIds") not in (None, [])
            or entry.get("system") is True or entry.get("visibility") not in (None, "config")
        ):
            raise ValueError(f"conflicting or unreadable production environment: {key}")
        checked.add(key)
    return {"ok": True, "project": required, "outputDirectory": None, "production_variable_keys_checked": sorted(checked)}


def publish_production(
    input_dir: Path | None, web_dir: Path, confirm: bool,
) -> tuple[bool, dict[str, Any]]:
    if not confirm:
        report = report_base("production")
        report.update(state="confirmation_required", errors=["production deploy requires --confirm-production"])
        return False, report
    preliminary = report_base("production")
    try:
        project_id, team_id = expected_target_ids()
        selection = release_selection(input_dir, web_dir)
        require_check(preliminary, "remote_configuration", remote_configuration(selection["bundle"], web_dir, project_id, team_id))
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.SubprocessError) as exc:
        preliminary.update(state="blocked_before_submission", errors=[str(exc)])
        return False, preliminary
    ok, report = publish_preflight(
        input_dir=input_dir, web_dir=web_dir, run_external_checks=True, confirm_preparation=True,
    )
    report["mode"] = "production"
    report["checks"].update(preliminary["checks"])
    if not ok:
        return False, report
    stage = Path(report["deploy_source_dir"])
    try:
        if report["source_revision"] != selection["revision"] or report["bundle"] != selection["bundle"]:
            raise ValueError("release selection changed during preparation")
        scope, project = report["target"]["scope"], report["target"]["project"]
        require_check(report, "authentication", command_status(run_command(
            [command_name("vercel"), "whoami", "--scope", scope], cwd=stage, timeout=60,
        )))
        require_check(report, "pre_submission_configuration", remote_configuration(report["bundle"], stage, project_id, team_id))
        verify_pinned_stage(report, "pre_submission_identity", stage)
        command = deploy_command(stage, project_id=project_id, bundle=report["bundle"])
        # CLI launch/timeout may already have changed the remote. Never retry here.
        report.update(deploy_executed=True, state="submission_unverified", ready_to_submit=False)
        submission = run_command(command, cwd=stage, timeout=600)
        require_check(report, "submission", command_status(submission))
        url = deployment_url(submission.get("stdout", ""))
        report["deployment_url"] = url
        inspection = run_command([
            command_name("vercel"), "inspect", url, "--wait", "--timeout=5m", "--json", "--scope", scope,
        ], cwd=stage, timeout=330)
        require_check(report, "inspection_command", command_status(inspection))
        receipt = json.loads(inspection.get("stdout") or "{}")
        if not isinstance(receipt, dict):
            raise ValueError("unsupported deployment inspection response")
        report["deployment"] = {key: receipt.get(key) for key in ("id", "url", "name", "contextName", "target", "readyState")}
        if (
            receipt.get("readyState") != "READY" or receipt.get("target") != "production"
            or receipt.get("url") != urlsplit(url).hostname or receipt.get("name") != project
            or receipt.get("contextName") != scope or not isinstance(receipt.get("id"), str)
            or not receipt["id"].startswith("dpl_")
        ):
            raise ValueError("deployment identity/READY unverified; inspect the recorded submission, do not resubmit")
        report.update(ok=True, state="provider_ready")
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.SubprocessError) as exc:
        report.update(
            ok=False, state="submission_unverified" if report["deploy_executed"] else "blocked_before_submission",
            errors=[str(exc)], ready_to_submit=False,
        )
    return report["ok"], report


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan, prepare, or explicitly deploy a committed frontend with unchanged artifacts.")
    parser.add_argument("--input", type=Path)
    parser.add_argument("--web-dir", type=Path, default=WEB_DIR)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--prepare", action="store_true")
    modes.add_argument("--deploy", action="store_true")
    parser.add_argument("--confirm-preparation", action="store_true")
    parser.add_argument("--confirm-production", action="store_true")
    parser.add_argument("--skip-external-checks", action="store_true", help="Legacy plan-only flag; forbidden for preparation/deployment.")
    args = parser.parse_args()
    if args.skip_external_checks and (args.prepare or args.deploy):
        parser.error("external checks cannot be skipped for preparation or deployment")
    if args.confirm_production and not args.deploy:
        parser.error("--confirm-production requires --deploy")
    if args.confirm_preparation and not args.prepare:
        parser.error("--confirm-preparation requires --prepare")
    if args.deploy:
        ok, report = publish_production(args.input, args.web_dir, args.confirm_production)
    else:
        ok, report = publish_preflight(
            args.input, args.web_dir, run_external_checks=args.prepare,
            confirm_preparation=args.confirm_preparation,
        )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
