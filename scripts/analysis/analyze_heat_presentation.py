from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_BUNDLE = Path("web/public/data/generated_20260805_prefer_scored_routed")
DEFAULT_OUTPUT = Path("qa/verification/heat_presentation_investigation_20260812.json")


UI_AUDIT_ENTRIES = [
    {
        "file": "web/app/layout.tsx",
        "line": 7,
        "string": "An explainable comfort score for source-derived Singapore postal records measuring rain shelter, heat, crossing friction, transit access, and bus frequency.",
        "verdict": "Overclaim: 'measuring heat' implies measured thermal/heat conditions; bundle marks heat as provisional covered + NParks shade proxy.",
        "action": "Change metadata copy to say rain shelter, transit access, crossings, bus service, and a provisional heat proxy.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 69,
        "string": "Heat comfort",
        "verdict": "Overclaim risk: standalone label can read as actual thermal comfort rather than a proxy.",
        "action": "Prefer 'Heat proxy' or make it visually subordinate to rain shelter.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 71,
        "string": "Mostly covered shelter plus sparse NParks greenery proxy; not measured shade.",
        "verdict": "Acceptable disclosure, but it contradicts stronger 'Heat comfort' and metadata wording.",
        "action": "Keep the caveat; align the row label and metadata with it.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 99,
        "string": "Better heat comfort",
        "verdict": "Overclaim risk: reason copy presents inferred proxy as comfort improvement.",
        "action": "Use 'More shelter/greenery proxy coverage' or 'Better heat-proxy score'.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 910,
        "string": "Search any Singapore address to see its walk-to-transit comfort score.",
        "verdict": "Mostly acceptable, but broad 'comfort score' should remain tied to source-derived/proxy evidence.",
        "action": "Optional: 'source-derived walk-to-transit comfort score'.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1025,
        "string": "Best route",
        "verdict": "Potential overclaim: reset target says 'best route' although output is a locked bundle-selected route, not personalized navigation.",
        "action": "Use 'Bundle route' or 'Scored route'.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1091,
        "string": "<Metric label={selectedRouteLabel} value={formatDistance(selectedDistance)} />",
        "verdict": "Acceptable if selectedRouteLabel remains 'Covered/Shortest/Preview'; it controls map/distance display, not score recomputation.",
        "action": "No fix required; keep score unchanged copy nearby.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1092,
        "string": '<Metric label="Sheltered" value={formatPercent(selectedCoverage)} />',
        "verdict": "Acceptable for rain/covered-linkway presentation; it is sourced by route coverage, not weather awareness.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1106,
        "string": '<Metric label="Sheltered evidence" value={formatPercent(selectedCoverage)} />',
        "verdict": "Acceptable honesty copy for preview shelter-map evidence.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1112,
        "string": "{reasons.map((reason) => (",
        "verdict": "Contains generated reason chips; heat chips can overclaim when using 'heat comfort' language.",
        "action": "Revise heat-specific reason strings rather than removing reason chips.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1121,
        "string": "Locked score breakdown",
        "verdict": "Acceptable provenance framing; tells user these are fixed bundle scores.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1122,
        "string": "Composite uses weights.yaml",
        "verdict": "Acceptable provenance framing, though technical.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1154,
        "string": "Single sub-score view; SHIOK score is unchanged.",
        "verdict": "Acceptable: explicitly says ranking control does not change score output.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1266,
        "string": "{item.label} <strong>{item.value}</strong>",
        "verdict": "Contains 'Shade proxy N%'; acceptable if kept as proxy, but can duplicate rounded rain/heat values without explaining dependence.",
        "action": "Prefer explicit covered metres vs shade-proxy metres if presenting heat separately.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1699,
        "string": "Singapore walk-to-transit comfort",
        "verdict": "Acceptable headline-level summary if nearby source/proxy disclosures remain visible.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1700,
        "string": "Data as of {formatDataDate(manifest)}",
        "verdict": "Acceptable: static data timestamp, not time/weather awareness.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1701,
        "string": '<p className={styles.sourceLine}>',
        "verdict": "Acceptable provenance surface for numbers/source claims.",
        "action": "No fix required.",
    },
    {
        "file": "web/app/page.tsx",
        "line": 1715,
        "string": "Heat: shelter + NParks shade proxy",
        "verdict": "Acceptable concise heat disclosure; stronger than 'Heat comfort'.",
        "action": "Keep or extend with 'not measured temperature/shade'.",
    },
    {
        "file": "web/components/route-evidence-map.tsx",
        "line": 863,
        "string": "return `Route evidence map for ${labels}, showing ${routeModeLabel(mode)}`;",
        "verdict": "Acceptable: says evidence map rather than scored/current route.",
        "action": "No fix required.",
    },
    {
        "file": "web/components/route-evidence-map.tsx",
        "line": 904,
        "string": "return `Route evidence for ${routeLabels}. Showing ${visibleRoutes}, ${exposed}, and ${poiText}.`;",
        "verdict": "Acceptable screen-reader evidence summary; numbers are derived from loaded GeoJSON features.",
        "action": "No fix required.",
    },
    {
        "file": "web/lib/transit-popup.ts",
        "line": 28,
        "string": "return `${value} min best`;",
        "verdict": "Overclaim risk: 'best' lacks provenance/window detail and can read as current wait time.",
        "action": "Use 'best scheduled peak headway' or include AM/PM peak context in value copy.",
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
        validated.append(
            {
                **entry,
                "actual_line": actual,
                "line_match": actual == expected or expected in (actual or ""),
            }
        )
    return validated


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze heat/rain presentation in a static SHIOK bundle.")
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    repo_root = Path.cwd()
    bundle = args.bundle
    if not bundle.is_absolute():
        bundle = repo_root / bundle
    output = args.output
    if not output.is_absolute():
        output = repo_root / output

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
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

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
