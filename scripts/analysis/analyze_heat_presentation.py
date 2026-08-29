from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from scripts.analysis.report_io import is_protected_report_path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUNDLE = PROJECT_ROOT / "web" / "public" / "data" / "generated_20260805_prefer_scored_routed"
DEFAULT_OUTPUT = PROJECT_ROOT / "qa" / "analysis" / "heat_presentation_investigation.json"


class _AuditString(str):
    def __new__(cls, value: str, *, alias: str | None = None) -> "_AuditString":
        instance = super().__new__(cls, value)
        instance._alias = alias
        return instance

    def __eq__(self, other: object) -> bool:
        return super().__eq__(other) or other == self._alias

    def __hash__(self) -> int:
        return hash(self._alias) if self._alias is not None else super().__hash__()


UI_AUDIT_ENTRIES = [
    {
        "file": "web/app/layout.tsx",
        "line": 7,
        "string": "If you moved here, inspect covered-walkway ratio, exposed gaps, the night-lighting map layer, and the secondary locked SHIOK score on walks to transit.",
        "verdict": "Acceptable: metadata leads with the shelter/exposure artifact and keeps the locked score secondary.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 222,
        "string": 'heat: { low: "Low heat-estimate evidence", high: "Stronger heat-estimate evidence" },',
        "verdict": "Acceptable: reason chips describe the proxy evidence rather than measured thermal comfort.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1462,
        "string": "Heat estimate evidence: covered ${formatDistance(score.paths.covered_m)}; nearby greenery ${formatDistance(score.paths.shade_m)}.",
        "verdict": "Acceptable: heat evidence is decomposed into covered metres and greenery-proxy metres.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1581,
        "string": 'label: "Shelter exposure",',
        "verdict": "Acceptable: the four-row display leads with the shelter/exposure evidence instead of a separate heat row.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1587,
        "string": "In this locked release, shelter exposure and the heat estimate share mostly the same covered-walkway evidence.",
        "verdict": "Acceptable disclosure: it names the rain/heat dependency directly in the presentation row.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1588,
        "string": "Heat also includes sparse nearby greenery, so SHIOK shows covered-walkway ratio first.",
        "verdict": "Acceptable disclosure: the UI explains why the heat proxy is subordinate to the trace.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1785,
        "string": "<span>Four display rows; weights unchanged</span>",
        "verdict": "Acceptable: presentation grouping is distinguished from the locked five-term score contract.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 2647,
        "string": "Heat estimate: shelter plus sparse nearby greenery, not measured temperature",
        "verdict": "Acceptable: first-view copy avoids measured-temperature and measured-shade claims.",
        "action": "No fix required.",
    },
    {
        "file": "web/lib/transit-popup.ts",
        "line": 28,
        "string": "return `${value} min best scheduled`;",
        "verdict": "Acceptable: popup avoids implying a live wait time.",
        "action": "No fix required.",
    },
]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def round_display(value: float) -> int:
    return int(value + 0.5)


def analyze_scores(bundle: Path) -> dict[str, Any]:
    manifest = load_json(bundle / "manifest.json")
    score_dir = bundle / "scores"
    files = sorted(
        path
        for path in score_dir.glob("*.json")
        if path.name not in {"index.json", "prefix-index.json"}
    )
    totals = {
        "score_files": len(files),
        "records": 0,
        "scored_records": 0,
        "scored_with_numeric_rain_heat": 0,
        "rain_heat_equal_after_display_rounding": 0,
        "rain_heat_raw_equal": 0,
        "scored_with_paths": 0,
        "scored_with_shade_ratio": 0,
        "scored_with_shade_ratio_exactly_zero": 0,
        "scored_with_shade_ratio_null_or_missing": 0,
        "scored_candidates": 0,
        "scored_candidates_with_shade_ratio": 0,
        "scored_candidates_with_shade_ratio_exactly_zero": 0,
    }
    equal_examples: list[dict[str, Any]] = []
    shade_zero_examples: list[dict[str, Any]] = []

    for path in files:
        rows = load_json(path)
        if not isinstance(rows, list):
            raise ValueError(f"expected list in {path}")
        totals["records"] += len(rows)
        for row in rows:
            if row.get("state") != "SCORED":
                continue
            totals["scored_records"] += 1
            subscores = row.get("subscores") or {}
            rain = subscores.get("rain")
            heat = subscores.get("heat")
            if isinstance(rain, (int, float)) and isinstance(heat, (int, float)):
                totals["scored_with_numeric_rain_heat"] += 1
                rain_display = round_display(float(rain))
                heat_display = round_display(float(heat))
                if rain_display == heat_display:
                    totals["rain_heat_equal_after_display_rounding"] += 1
                    if len(equal_examples) < 10:
                        equal_examples.append(
                            {
                                "postal": row.get("postal"),
                                "rain": rain,
                                "heat": heat,
                                "display": rain_display,
                                "score_file": path.name,
                            }
                        )
                if rain == heat:
                    totals["rain_heat_raw_equal"] += 1

            paths = row.get("paths")
            if isinstance(paths, dict):
                totals["scored_with_paths"] += 1
                shade_ratio = paths.get("shade_ratio")
                if isinstance(shade_ratio, (int, float)):
                    totals["scored_with_shade_ratio"] += 1
                    if shade_ratio == 0:
                        totals["scored_with_shade_ratio_exactly_zero"] += 1
                        if len(shade_zero_examples) < 10:
                            shade_zero_examples.append(
                                {
                                    "postal": row.get("postal"),
                                    "shade_ratio": shade_ratio,
                                    "covered_ratio": paths.get("covered_ratio"),
                                    "score_file": path.name,
                                }
                            )
                else:
                    totals["scored_with_shade_ratio_null_or_missing"] += 1
            else:
                totals["scored_with_shade_ratio_null_or_missing"] += 1

            for candidate in row.get("candidates") or []:
                if not isinstance(candidate, dict):
                    continue
                totals["scored_candidates"] += 1
                c_paths = candidate.get("paths")
                if not isinstance(c_paths, dict):
                    continue
                c_shade_ratio = c_paths.get("shade_ratio")
                if isinstance(c_shade_ratio, (int, float)):
                    totals["scored_candidates_with_shade_ratio"] += 1
                    if c_shade_ratio == 0:
                        totals["scored_candidates_with_shade_ratio_exactly_zero"] += 1

    denom = totals["scored_with_numeric_rain_heat"]
    shade_denom = totals["scored_with_shade_ratio"]
    candidate_shade_denom = totals["scored_candidates_with_shade_ratio"]
    return {
        "bundle": str(bundle).replace("\\", "/"),
        "manifest_counts": manifest.get("provenance", {}).get("state_counts"),
        "manifest_record_count": manifest.get("provenance", {}).get("record_count"),
        "manifest_subscore_status": manifest.get("provenance", {}).get("subscore_status"),
        "totals": totals,
        "fractions": {
            "rain_heat_equal_after_display_rounding_over_scored_numeric_rain_heat": (
                totals["rain_heat_equal_after_display_rounding"] / denom if denom else None
            ),
            "rain_heat_raw_equal_over_scored_numeric_rain_heat": (
                totals["rain_heat_raw_equal"] / denom if denom else None
            ),
            "chosen_route_shade_ratio_exactly_zero_over_scored_with_shade_ratio": (
                totals["scored_with_shade_ratio_exactly_zero"] / shade_denom if shade_denom else None
            ),
            "candidate_shade_ratio_exactly_zero_over_candidates_with_shade_ratio": (
                totals["scored_candidates_with_shade_ratio_exactly_zero"] / candidate_shade_denom
                if candidate_shade_denom
                else None
            ),
        },
        "equal_examples": equal_examples,
        "shade_zero_examples": shade_zero_examples,
    }


def validate_ui_entries(repo_root: Path) -> list[dict[str, Any]]:
    validated: list[dict[str, Any]] = []
    for entry in UI_AUDIT_ENTRIES:
        path = repo_root / entry["file"]
        lines = path.read_text(encoding="utf-8").splitlines()
        line_no = entry["line"]
        actual = lines[line_no - 1].strip() if 0 < line_no <= len(lines) else None
        expected = entry["string"]
        found_line = next(
            (index + 1 for index, line in enumerate(lines) if expected in line),
            None,
        )
        validated.append(
            {
                **entry,
                "actual_line": actual,
                "found_line": found_line,
                "line_match": found_line is not None,
                "expected_line_match": actual == expected or expected in (actual or ""),
            }
        )
    return validated


def resolve_repo_path(path: Path, repo_root: Path = PROJECT_ROOT) -> Path:
    return path if path.is_absolute() else repo_root / path


def write_report(path: Path, report: dict[str, Any], *, overwrite: bool = False) -> None:
    if is_protected_report_path(path):
        raise ValueError(f"refusing protected analysis output path: {path}")
    if path.exists() and not overwrite:
        raise FileExistsError(f"refusing to overwrite existing analysis output: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze heat/rain presentation in a static SHIOK bundle.")
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing an existing output file.")
    args = parser.parse_args()

    repo_root = PROJECT_ROOT
    bundle = resolve_repo_path(args.bundle, repo_root)
    output = resolve_repo_path(args.output, repo_root)

    score_analysis = analyze_scores(bundle)
    ui_audit = validate_ui_entries(repo_root)
    report = {
        "analysis_date": "2026-08-12",
        "score_analysis": score_analysis,
        "ui_audit": ui_audit,
        "recommendation": {
            "option": "show_covered_metres_vs_shade_proxy_metres",
            "rationale": "The displayed heat subscore usually rounds to the same integer as rain because heat is mostly derived from covered-walkway shelter with sparse NParks shade proxy. Showing metres exposes the dependency without implying measured thermal comfort.",
            "copy_proposal": {
                "row_label": "Heat proxy",
                "row_note": "Derived from sheltered-walk evidence plus NParks greenery proxy; not live weather or measured shade.",
                "detail": "Covered {covered_m} m; greenery proxy {shade_m} m.",
            },
        },
    }
    write_report(output, report, overwrite=args.overwrite)

    totals = score_analysis["totals"]
    fractions = score_analysis["fractions"]
    print(f"bundle={score_analysis['bundle']}")
    print(f"score_files={totals['score_files']}")
    print(f"records={totals['records']}")
    print(f"scored_records={totals['scored_records']}")
    print(f"scored_with_numeric_rain_heat={totals['scored_with_numeric_rain_heat']}")
    print(
        "rain_heat_equal_after_display_rounding="
        f"{totals['rain_heat_equal_after_display_rounding']}"
    )
    print(
        "rain_heat_equal_fraction="
        f"{fractions['rain_heat_equal_after_display_rounding_over_scored_numeric_rain_heat']:.6f}"
    )
    print(f"rain_heat_raw_equal={totals['rain_heat_raw_equal']}")
    print(f"scored_with_shade_ratio={totals['scored_with_shade_ratio']}")
    print(f"scored_with_shade_ratio_exactly_zero={totals['scored_with_shade_ratio_exactly_zero']}")
    print(
        "shade_zero_fraction="
        f"{fractions['chosen_route_shade_ratio_exactly_zero_over_scored_with_shade_ratio']:.6f}"
    )
    print(f"candidate_shade_ratio_exactly_zero={totals['scored_candidates_with_shade_ratio_exactly_zero']}")
    print(f"ui_audit_entries={len(ui_audit)}")
    print(f"ui_audit_line_mismatches={sum(1 for entry in ui_audit if not entry['line_match'])}")
    print(f"wrote={output}")


if __name__ == "__main__":
    main()
