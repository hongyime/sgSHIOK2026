import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TransitStopPicker } from "../../components/transit-stop-picker";
import { selectPublishedTransitChoices, type PublishedTransitChoices } from "../published-transit-choices";
import { normalizePublishedTransitOptions, type PublishedTransitCategory } from "../published-transit-options";
import publishedFixture from "./fixtures/published-options.json";
import {
  candidateComparison,
  deriveNearestTransitCandidates,
  haversineMeters,
  nextChipAction,
  resolveBestCandidateId,
  type TransitCandidate,
} from "../nearest-transit";
import type {
  ScoreRecord,
  TransitPoiCollection,
  TransitPoiFeature,
} from "../types";

// -- Fixtures ----------------------------------------------------------------

function poi(overrides: Partial<TransitPoiFeature> & {
  id: string;
  kind: "bus_stop" | "mrt_exit" | "mrt_station";
  coords: [number, number];
  name?: string;
  code?: string;
  station?: string;
  exit?: string;
}): TransitPoiFeature {
  const { id, kind, coords, name, code, station, exit, ...rest } = overrides;
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coords },
    properties: {
      id,
      kind,
      name: name ?? id,
      ...(code ? { code } : {}),
      ...(station ? { station } : {}),
      ...(exit ? { exit } : {}),
    },
    ...rest,
  } as TransitPoiFeature;
}

const originLat = 1.35;
const originLng = 103.85;

const CANDIDATES: TransitPoiCollection = {
  type: "FeatureCollection",
  features: [
    poi({ id: "bus:66361", kind: "bus_stop", coords: [103.8501, 1.3501], name: "Blk 319", code: "66361" }),
    poi({ id: "bus:66411", kind: "bus_stop", coords: [103.8510, 1.3510], name: "Blk 326", code: "66411" }),
    poi({ id: "mrt:21491", kind: "mrt_exit", coords: [103.8520, 1.3505], name: "TEST MRT STATION Exit A", station: "TEST MRT STATION", exit: "Exit A" }),
    poi({ id: "bus:66401", kind: "bus_stop", coords: [103.8530, 1.3495], name: "Golden Hts", code: "66401" }),
    poi({ id: "bus:66421", kind: "bus_stop", coords: [103.8540, 1.3490], name: "Blk 400", code: "66421" }),
    poi({ id: "bus:66431", kind: "bus_stop", coords: [103.8560, 1.3480], name: "Blk 500", code: "66431" }),
    // Should be filtered out (station kind, not exit)
    poi({ id: "station:TEST", kind: "mrt_station", coords: [103.8520, 1.3505], name: "TEST MRT STATION" }),
  ],
};

const BUS_SCORE: ScoreRecord = {
  postal: "560231",
  state: "SCORED",
  total: 60,
  subscores: { access: 100, bus: 40, rain: 20, heat: 30, crossing: 80 },
  best_node: {
    type: "bus_stop",
    name: "Blk 319",
    routed_m: 200,
    exit: "66361",
    station: "Blk 319",
    straight_line_m: 60,
    snap_distance_m: 10,
  },
  paths: { shortest_m: 200, sheltered_m: 220, detour_pct: 10, routing_type: "sheltered", covered_ratio: 0.3, shortest_covered_ratio: 0.2 },
  exposure_gaps: [],
  data_as_of: null,
  provenance: {},
};

const MRT_SCORE: ScoreRecord = {
  ...BUS_SCORE,
  best_node: {
    type: "mrt_lrt_exit",
    name: "TEST MRT STATION Exit A",
    routed_m: 400,
    exit: "Exit A",
    station: "TEST MRT STATION",
    straight_line_m: 220,
    snap_distance_m: 8,
  },
};

// -- Pure logic --------------------------------------------------------------

describe("haversineMeters", () => {
  it("returns zero for identical points", () => {
    expect(haversineMeters(1.3, 103.8, 1.3, 103.8)).toBeCloseTo(0, 3);
  });

  it("computes ~157m for one lat-arcsecond apart at Singapore latitude", () => {
    const meters = haversineMeters(1.35, 103.85, 1.3514, 103.85);
    // 0.0014 deg latitude ~= 155-160m depending on formula; assert order of magnitude
    expect(meters).toBeGreaterThan(150);
    expect(meters).toBeLessThan(165);
  });
});

describe("deriveNearestTransitCandidates", () => {
  it("returns up to 5 nearest bus_stop + mrt_exit POIs sorted by distance", () => {
    const result = deriveNearestTransitCandidates({
      originLat,
      originLng,
      transitPois: CANDIDATES,
      mode: "best_transit",
      limit: 5,
    });
    expect(result).toHaveLength(5);
    // No mrt_station in results
    expect(result.every((c) => c.kind === "bus_stop" || c.kind === "mrt_exit")).toBe(true);
    // Sorted ascending
    for (let i = 1; i < result.length; i++) {
      expect(result[i].straight_line_m).toBeGreaterThanOrEqual(result[i - 1].straight_line_m);
    }
  });

  it("filters to bus_stop only when mode=bus", () => {
    const result = deriveNearestTransitCandidates({
      originLat,
      originLng,
      transitPois: CANDIDATES,
      mode: "bus",
      limit: 5,
    });
    expect(result.every((c) => c.kind === "bus_stop")).toBe(true);
  });

  it("filters to mrt_exit only when mode=mrt_lrt", () => {
    const result = deriveNearestTransitCandidates({
      originLat,
      originLng,
      transitPois: CANDIDATES,
      mode: "mrt_lrt",
      limit: 5,
    });
    expect(result.every((c) => c.kind === "mrt_exit")).toBe(true);
  });

  it("returns [] for empty inputs", () => {
    expect(
      deriveNearestTransitCandidates({
        originLat,
        originLng,
        transitPois: null,
        mode: "best_transit",
      })
    ).toEqual([]);
    expect(
      deriveNearestTransitCandidates({
        originLat: NaN,
        originLng: 0,
        transitPois: CANDIDATES,
        mode: "best_transit",
      })
    ).toEqual([]);
  });
});

describe("resolveBestCandidateId", () => {
  it("maps a bus best_node to bus:<code>", () => {
    const candidates = deriveNearestTransitCandidates({
      originLat,
      originLng,
      transitPois: CANDIDATES,
      mode: "best_transit",
      limit: 5,
    });
    expect(resolveBestCandidateId(candidates, BUS_SCORE)).toBe("bus:66361");
  });

  it("maps an MRT exit best_node by station + exit fields", () => {
    const candidates = deriveNearestTransitCandidates({
      originLat,
      originLng,
      transitPois: CANDIDATES,
      mode: "mrt_lrt",
      limit: 5,
    });
    expect(resolveBestCandidateId(candidates, MRT_SCORE)).toBe("mrt:21491");
  });

  it("returns null when the best_node is missing", () => {
    expect(resolveBestCandidateId([], null)).toBeNull();
  });
});

describe("candidateComparison", () => {
  it("returns null when either side is missing", () => {
    const a: TransitCandidate = { id: "a", name: "a", kind: "bus_stop", straight_line_m: 100, coordinates: [0, 0] };
    expect(candidateComparison(null, a)).toBeNull();
    expect(candidateComparison(a, null)).toBeNull();
  });

  it("computes % delta", () => {
    const best: TransitCandidate = { id: "best", name: "Best", kind: "bus_stop", straight_line_m: 100, coordinates: [0, 0] };
    const active: TransitCandidate = { id: "far", name: "Far", kind: "bus_stop", straight_line_m: 150, coordinates: [0, 0] };
    const result = candidateComparison(active, best);
    expect(result).not.toBeNull();
    expect(result!.fartherPct).toBeCloseTo(50, 5);
  });
});

describe("nextChipAction (keyboard math)", () => {
  const chips = ["reset", "a", "b", "c"];
  it("ArrowRight advances with wrap-around", () => {
    expect(nextChipAction(chips, 0, "ArrowRight")).toEqual({ kind: "focus", index: 1 });
    expect(nextChipAction(chips, 3, "ArrowRight")).toEqual({ kind: "focus", index: 0 });
  });
  it("ArrowLeft retreats with wrap-around", () => {
    expect(nextChipAction(chips, 1, "ArrowLeft")).toEqual({ kind: "focus", index: 0 });
    expect(nextChipAction(chips, 0, "ArrowLeft")).toEqual({ kind: "focus", index: 3 });
  });
  it("Enter and Space activate", () => {
    expect(nextChipAction(chips, 2, "Enter")).toEqual({ kind: "activate", chipId: "b" });
    expect(nextChipAction(chips, 2, " ")).toEqual({ kind: "activate", chipId: "b" });
  });
  it("Other keys are ignored", () => {
    expect(nextChipAction(chips, 2, "Escape")).toEqual({ kind: "ignore" });
    expect(nextChipAction([], 0, "ArrowRight")).toEqual({ kind: "ignore" });
  });
});

// -- Published picker: actual component callbacks and static native semantics --
// The old comparison-copy and source-handler assertions are replaced, not relabelled
// as behavioral passes. POI distance/comparison/keyboard helper tests above remain.
// No DOM is installed: callbacks execute on actual React elements; native keyboard
// behavior and pixel fit still require the parent's browser acceptance.
const bundle = "generated_20260805_prefer_scored_routed";
const postal = "018956";
const publishedScore = publishedFixture["scores/DOWNTOWN_CORE_PART_001.json"]
  .find(row => row.postal === postal)!;
const publishedGeometry = publishedFixture["geom/h3/886520db39fffff.json"][0];

function pool(category: PublishedTransitCategory = "mrt_lrt") {
  return normalizePublishedTransitOptions({
    bundle, postal, category,
    score: structuredClone(publishedScore),
    geometry: structuredClone(publishedGeometry),
    scoreContext: { bundle, postal },
    geometryContext: { bundle, postal },
  });
}

function choices(category: PublishedTransitCategory = "mrt_lrt", current?: string | null) {
  return selectPublishedTransitChoices(pool(category), category, current);
}

function freeze(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}

type Element = ReactElement<{
  children?: ReactNode;
  onClick?: () => void;
  type?: string;
  role?: string;
  title?: string;
  open?: boolean;
  onKeyDown?: unknown;
  tabIndex?: number;
  "aria-pressed"?: boolean;
  "aria-label"?: string;
}>;

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Element["props"]>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement<Element["props"]>(node)) return text(node.props.children);
  return "";
}
function choiceButtons(tree: ReactNode) {
  return elements(tree).filter(element => element.type === "button" &&
    typeof element.props["aria-pressed"] === "boolean");
}
function resetButton(tree: ReactNode) {
  return elements(tree).find(element => element.type === "button" &&
    element.props["aria-label"] === "Use published default");
}
function renderPicker(selection: PublishedTransitChoices, onSelect = vi.fn()) {
  const before = structuredClone(selection);
  freeze(selection);
  const tree = TransitStopPicker({ selection, onSelect });
  const html = renderToStaticMarkup(tree);
  expect(selection).toEqual(before);
  expect(fetch).not.toHaveBeenCalled();
  return { tree, html, onSelect };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Picker must not fetch"); }));
});
afterEach(() => vi.unstubAllGlobals());

describe("TransitStopPicker published choices", () => {
  it("hides an empty selection and a sole current published default", () => {
    expect(renderPicker({ choices: [], defaultKey: null, selectedKey: null }).tree).toBeNull();
    const single = choices("bus");
    expect(single.choices).toHaveLength(1);
    expect(single.selectedKey).toBe(single.defaultKey);
    expect(renderPicker(single).tree).toBeNull();
  });

  it("is a collapsed native disclosure with a visible count and named group", () => {
    const selection = choices();
    const { tree, html } = renderPicker(selection);
    expect(tree?.type).toBe("details");
    expect(tree?.props.open).toBeUndefined();
    const summary = elements(tree).filter(element => element.type === "summary");
    expect(summary).toHaveLength(1);
    expect(text(summary[0])).toBe("Other walks (2)");
    expect(elements(tree).filter(element => element.props.role === "group")
      .map(element => element.props["aria-label"])).toEqual(["Published walks"]);
    expect(html).not.toMatch(/Nearby|straight-line|farther than|all nearby|current|default/i);
    expect(resetButton(tree)).toBeUndefined();
  });

  it("uses the real category default absent from candidate summaries without inventing an ID", () => {
    const selection = choices();
    const declared = selection.choices.find(choice => choice.option.key === selection.defaultKey)!;
    expect(declared.option.name).toBe("BAYFRONT MRT STATION Exit E");
    expect(declared.option.selectionRef).toEqual({ kind: "category_default", category: "mrt_lrt" });
    expect(publishedScore.candidates.some(candidate => candidate.node_name === declared.option.name)).toBe(false);
    const { tree, onSelect } = renderPicker(selection);
    const button = choiceButtons(tree).find(element => text(element).includes(declared.option.name!))!;
    button.props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(declared.option.key);
    expect(button.props["aria-pressed"]).toBe(true);
  });

  it("shows sheltered-route metres and coverage for every choice, including the current default", () => {
    const { tree } = renderPicker(choices());
    const labels = choiceButtons(tree).map(text);
    expect(labels).toEqual([
      "BAYFRONT MRT STATION Exit C109 m walk0% coveredShortest shown",
      "BAYFRONT MRT STATION Exit E308 m walk24% coveredMost covered",
    ]);
    expect(labels.join(" ")).not.toContain("294 m");
    expect(labels.join(" ")).not.toContain("245 m");
  });

  it("executes actual selection callbacks then renders controlled current/reset state", () => {
    const normalized = pool();
    let current: string | null | undefined;
    const onSelect = vi.fn((key: string | null) => { current = key; });
    const initial = renderPicker(selectPublishedTransitChoices(normalized, "mrt_lrt"), onSelect);
    const nextKey = initial.tree && choices().choices[0].option.key;
    choiceButtons(initial.tree)[0].props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(nextKey);
    const updated = renderPicker(selectPublishedTransitChoices(normalized, "mrt_lrt", current), onSelect);
    expect(choiceButtons(updated.tree).map(button => button.props["aria-pressed"])).toEqual([true, false]);
    expect(resetButton(updated.tree)).toBeDefined();
    resetButton(updated.tree)!.props.onClick!();
    expect(onSelect.mock.calls).toEqual([[nextKey], [null]]);
    expect(current).toBeNull();
    // The parent owns mapping reset(null) to its declared-default state.
    const reset = renderPicker(selectPublishedTransitChoices(normalized, "mrt_lrt"), onSelect);
    expect(resetButton(reset.tree)).toBeUndefined();
    expect(choiceButtons(reset.tree).map(button => button.props["aria-pressed"])).toEqual([false, true]);
  });

  it("keeps three choices maximum with a separate reset even when the default is not listed", () => {
    const normalized = pool();
    const current = normalized.options.find(option => option.aliases.includes("mrt:21678"))!;
    const selection = selectPublishedTransitChoices(normalized, "mrt_lrt", current.key);
    expect(selection.choices).toHaveLength(3);
    // Normalized selector contract permits a reset target outside the displayed three.
    selection.defaultKey = JSON.stringify(["unavailable-published-default"]);
    const { tree, onSelect } = renderPicker(selection);
    expect(choiceButtons(tree)).toHaveLength(3);
    expect(elements(tree).filter(element => element.type === "button")).toHaveLength(4);
    expect(text(elements(tree).find(element => element.type === "summary"))).toBe("Other walks (3)");
    resetButton(tree)!.props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("defensively bounds overlong supplied choices without adding a filler option", () => {
    const selection = choices();
    const extra = structuredClone(selection.choices[0]);
    extra.option.key = "synthetic-extra-1";
    const fourth = structuredClone(extra);
    fourth.option.key = "synthetic-extra-2";
    selection.choices.push(extra, fourth);
    const { tree } = renderPicker(selection);
    expect(choiceButtons(tree)).toHaveLength(3);
    expect(choiceButtons(tree).map(button => button.key))
      .toEqual(selection.choices.slice(0, 3).map(choice => choice.option.key));
  });

  it("merges real duplicate default/candidate winner roles into one rendered choice", () => {
    const selection = choices("bus", null);
    expect(selection.choices).toHaveLength(1);
    expect(selection.choices[0].option.sources.length).toBe(3);
    expect(selection.choices[0].roles).toEqual(["shortest", "most_covered"]);
    const { tree, onSelect } = renderPicker(selection);
    expect(choiceButtons(tree)).toHaveLength(1);
    expect(text(choiceButtons(tree)[0])).toContain("Shortest shown / Most covered");
    expect(text(choiceButtons(tree)[0])).not.toMatch(/Current|Default/);
    expect(choiceButtons(tree)[0].props["aria-pressed"]).toBe(false);
    choiceButtons(tree)[0].props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(selection.choices[0].option.key);
  });

  it.each(["missing", "invalid"] as const)("prints %s metrics as unavailable, not zero or another distance", status => {
    const selection = choices();
    const chosen = selection.choices[0].option;
    chosen.metrics.sheltered_m = { status, reason: "synthetic-boundary", sourceField: "paths.sheltered_m" };
    chosen.metrics.covered_ratio = { status, reason: "synthetic-boundary", sourceField: "paths.covered_ratio" };
    const { tree } = renderPicker(selection);
    const label = text(choiceButtons(tree)[0]);
    expect(label).toContain("Walk distance unavailable");
    expect(label).toContain("Coverage unavailable");
    expect(label).not.toMatch(/\d+ m walk|\d+% covered|NaN|undefined/);
  });

  it("keeps valid zero coverage visible instead of calling it unavailable", () => {
    const { tree } = renderPicker(choices());
    const shortest = text(choiceButtons(tree)[0]);
    expect(shortest).toContain("0% covered");
    expect(shortest).not.toContain("Coverage unavailable");
  });

  it("rounds only for display without rewriting the supplied values or keys", () => {
    const selection = choices();
    const { tree } = renderPicker(selection);
    expect(selection.choices[0].option.metrics.sheltered_m).toMatchObject({ status: "valid", value: 109.2 });
    expect(selection.choices[1].option.metrics.covered_ratio).toMatchObject({ status: "valid", value: 0.241 });
    expect(choiceButtons(tree).map(button => button.key)).toEqual(selection.choices.map(choice => choice.option.key));
  });

  it("never reorders supplied choices by their rounded labels", () => {
    const selection = choices();
    selection.choices.reverse();
    const { tree } = renderPicker(selection);
    expect(choiceButtons(tree).map(button => button.key)).toEqual(selection.choices.map(choice => choice.option.key));
  });

  it("retains reset when the real default lacks geometry and is unavailable", () => {
    const normalized = pool();
    const declared = normalized.options.find(option =>
      option.sources.some(source => source.selectionRef.kind === "category_default"))!;
    // This clone isolates the UI's unavailable reset policy; T04 validates geometry.
    declared.retainable = false;
    declared.distanceRankable = false;
    declared.coverageRankable = false;
    const current = normalized.options.find(option => option.aliases.includes("mrt:21624"))!;
    const selection = selectPublishedTransitChoices(normalized, "mrt_lrt", current.key);
    expect(selection.selectedKey).toBe(current.key);
    expect(selection.defaultKey).toBe(declared.key);
    expect(selection.choices.some(choice => choice.option.key === declared.key)).toBe(false);
    const { tree, onSelect } = renderPicker(selection);
    expect(choiceButtons(tree)).toHaveLength(1);
    const reset = resetButton(tree)!;
    expect(reset.props.title).toBe("Use published default");
    expect(text(reset)).toBe("Use published default");
    reset.props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("does not show an empty picker when the default and every choice are unavailable", () => {
    const selection = choices();
    selection.choices = [];
    selection.selectedKey = null;
    const { tree, onSelect } = renderPicker(selection);
    expect(choiceButtons(tree)).toHaveLength(0);
    expect(tree).toBeNull();
    expect(resetButton(tree)).toBeUndefined();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not auto-select when rendering a changed or outdated current key", () => {
    const selection = choices();
    selection.selectedKey = "synthetic-stale-current";
    const { tree, onSelect } = renderPicker(selection);
    expect(choiceButtons(tree).every(button => button.props["aria-pressed"] === false)).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    resetButton(tree)!.props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("uses native buttons and summary semantics without trapping Tab, Enter, or Space", () => {
    const { tree } = renderPicker(choices("mrt_lrt", null));
    const buttons = elements(tree).filter(element => element.type === "button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.props.type).toBe("button");
      expect(button.props.tabIndex).toBeUndefined();
      expect(button.props.onKeyDown).toBeUndefined();
      expect(button.props.onClick).toBeTypeOf("function");
    }
    expect(elements(tree).every(element => element.props.onKeyDown === undefined)).toBe(true);
    expect(elements(tree).filter(element => element.type === "summary")).toHaveLength(1);
  });

  it.each(["bus", "mrt_lrt"] as const)("uses a category label for an unavailable %s destination name, never a fabricated ID", category => {
    const selection = choices(category, null);
    selection.choices[0].option.name = null;
    const { tree } = renderPicker(selection);
    const label = text(choiceButtons(tree)[0]);
    expect(label.startsWith(category === "bus" ? "Bus stop" : "MRT/LRT exit")).toBe(true);
    expect(label).not.toContain(selection.choices[0].option.key);
  });

  it("preserves and safely escapes long published destination text", () => {
    const selection = choices();
    const name = "<script>UnbrokenDestination".repeat(20);
    selection.choices[0].option.name = name;
    const { tree, html } = renderPicker(selection);
    expect(text(choiceButtons(tree)[0])).toContain(name);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("TransitStopPicker narrow-container CSS constraints (not a browser pixel measurement)", () => {
  const css = readFileSync(join(__dirname, "../../components/transit-stop-picker.module.css"), "utf8");
  function rule(selector: string): string {
    const blocks = Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .filter(match => match[1].split(",").map(value => value.trim()).includes(selector));
    expect(blocks.length).toBeGreaterThan(0);
    return blocks.map(match => match[2]).join("\n");
  }

  it("lets a 320px parent shrink the picker and buttons with border-box sizing", () => {
    expect(rule(".picker")).toMatch(/min-width:\s*0/);
    expect(rule(".picker")).toMatch(/max-width:\s*100%/);
    expect(rule(".choice")).toMatch(/box-sizing:\s*border-box/);
    expect(rule(".choice")).toMatch(/min-width:\s*0/);
    expect(rule(".choice")).toMatch(/max-width:\s*100%/);
    expect(rule(".choices")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(rule(".choice")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it("wraps metrics, roles and unbroken names instead of clipping or horizontal scrolling", () => {
    expect(rule(".metrics")).toMatch(/flex-wrap:\s*wrap/);
    for (const selector of [".choice", ".reset", ".destination", ".roles", ".metrics > span"]) {
      expect(rule(selector)).toMatch(/overflow-wrap:\s*anywhere/);
    }
    expect(css).not.toMatch(/white-space:\s*nowrap|text-overflow:\s*ellipsis|overflow-x:\s*(auto|scroll)/);
    expect(css).not.toMatch(/font-size:[^;]*(vw|cqw)|letter-spacing:\s*-/);
  });

  it("keeps native tap targets and visible keyboard focus without a nested floating card", () => {
    for (const selector of [".choice", ".reset", ".summary"]) {
      expect(rule(selector)).toMatch(/min-height:\s*44px/);
      expect(rule(selector + ":focus-visible")).toMatch(/outline:\s*2px solid/);
    }
    expect(rule(".picker")).not.toMatch(/box-shadow|backdrop-filter|border-radius|background/);
  });
});
