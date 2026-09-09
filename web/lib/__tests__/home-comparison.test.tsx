import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeComparison, type HomeComparisonProps } from "../../components/home-comparison";
import { FailureDiagnosticsControl, type FailureDiagnosticsControlProps } from "../../components/failure-diagnostics-control";
import type { ArtifactFailure } from "../artifact-failure";
import { resolveComparisonWalk } from "../comparison";
import type { ComparisonEntry } from "../comparison-controller";
import { emptyComparisonState, transitionComparison } from "../comparison-state";
import type { PublishedTransitCategory } from "../published-transit-options";
import fixture from "./fixtures/published-options.json";

// Actual handlers with deterministic hooks/focus doubles, not browser layout/focus acceptance.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[] };
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: Array<() => void> = [];
  return {
    begin() { cursor = 0; },
    reset() { slots.length = 0; cursor = 0; effects = []; },
    commit() { const pending = effects; effects = []; pending.forEach(effect => effect()); },
    useRef<T>(value: T): { current: T } {
      const slot = slots[cursor++] ??= { value: { current: value } };
      return slot.value as { current: T };
    },
    useLayoutEffect(effect: () => void, deps: readonly unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!slot.deps || slot.deps.length !== deps.length || deps.some((dep, index) => !Object.is(dep, slot.deps![index]))) {
        slot.deps = deps;
        effects.push(effect);
      }
    },
  };
});

vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const hooks = { useRef: host.useRef, useLayoutEffect: host.useLayoutEffect };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});

type Element = ReactElement<{
  children?: ReactNode;
  ref?: { current: unknown };
  onClick?: (event: { currentTarget: FocusButton }) => void;
  onKeyDown?: (event: { key: string; stopPropagation: () => void }) => void;
  disabled?: boolean;
  type?: string;
  title?: string;
  scope?: string;
  tabIndex?: number;
  style?: React.CSSProperties;
  role?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "data-comparison-close"?: boolean;
  "data-comparison-panel"?: boolean;
  "data-comparison-remove"?: string;
  "data-map-overlay"?: string;
}>;

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Element["props"]>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return React.isValidElement<Element["props"]>(node) ? text(node.props.children) : "";
}

function freeze(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}

const bundle = "generated_20260805_prefer_scored_routed";
const realPostal = "018956";
const secondPostal = "018990";
const thirdPostal = "079908";

function entry(postal = realPostal, category: PublishedTransitCategory = "bus", withGeometry = true): ComparisonEntry {
  const source = {
    bundle, postal, category,
    score: structuredClone(fixture["scores/DOWNTOWN_CORE_PART_001.json"].find(row => row.postal === postal)),
    geometry: postal === realPostal && withGeometry ? structuredClone(fixture["geom/h3/886520db39fffff.json"][0]) : null,
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  };
  return { postal, requestKey: 1, status: "ready", geometryStatus: "ready", ...resolveComparisonWalk(source) };
}

let props: HomeComparisonProps;
let fetchSpy: ReturnType<typeof vi.fn>;
let storageRead: ReturnType<typeof vi.fn>;
let storageWrite: ReturnType<typeof vi.fn>;
let tree: ReactNode;
type FocusButton = {
  ownerDocument: typeof focusDocument;
  dataset: { comparisonRemove?: string };
  disabled: boolean;
  focus: ReturnType<typeof vi.fn>;
};
let focusDocument: { activeElement: unknown; body: object; documentElement: object };
let mountedButtons: Map<string, FocusButton>;
let focusedByComponent: string[];

function mountNodes() {
  const previous = mountedButtons;
  mountedButtons = new Map();
  for (const element of elements(tree).filter(node => node.type === "button")) {
    const name = element.props["aria-label"] ?? text(element);
    const node = previous.get(name) ?? {
      ownerDocument: focusDocument, dataset: {}, disabled: false,
      focus: vi.fn(() => { focusDocument.activeElement = mountedButtons.get(name); focusedByComponent.push(name); }),
    };
    node.disabled = element.props.disabled === true;
    node.dataset = { comparisonRemove: element.props["data-comparison-remove"] };
    mountedButtons.set(name, node);
  }
  if ([...previous.values()].includes(focusDocument.activeElement as FocusButton) &&
      ![...mountedButtons.values()].includes(focusDocument.activeElement as FocusButton)) focusDocument.activeElement = focusDocument.body;
  const root = elements(tree)[0];
  if (root.props.ref) root.props.ref.current = {
    querySelectorAll: () => [...mountedButtons.values()].filter(node => node.dataset.comparisonRemove !== undefined),
    querySelector: (selector: string) => mountedButtons.get(selector.includes("Share comparison") ? "Share comparison" : "Close comparison"),
  };
}

function render() {
  freeze(props.state);
  freeze(props.entries);
  host.begin();
  tree = HomeComparison(props);
  mountNodes();
  host.commit();
  return tree;
}

function button(name: string): Element {
  const found = elements(tree).find(node => node.type === "button" && (node.props["aria-label"] ?? text(node)) === name);
  expect(found, name).toBeDefined();
  return found!;
}

function click(name: string) {
  const target = button(name);
  expect(target.props.disabled).not.toBe(true);
  target.props.onClick!({ currentTarget: mountedButtons.get(name)! });
}

function cells(label: string): string[] {
  const row = elements(tree).find(node => node.type === "tr" &&
    elements(node.props.children).some(child => child.type === "th" && child.props.scope === "row" && text(child) === label));
  expect(row, label).toBeDefined();
  return elements(row!.props.children).filter(node => node.type === "td").map(text);
}

beforeEach(() => {
  host.reset();
  focusDocument = { activeElement: null, body: {}, documentElement: {} };
  mountedButtons = new Map(); focusedByComponent = [];
  fetchSpy = vi.fn(() => { throw new Error("Comparison presentation must not fetch"); });
  storageRead = vi.fn(); storageWrite = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.stubGlobal("localStorage", { getItem: storageRead, setItem: storageWrite });
  props = {
    state: { version: 1, postals: [realPostal], category: "bus", activePostal: realPostal },
    entries: { [realPostal]: entry() }, storageUnavailable: false, shared: false,
    onSaveShared: vi.fn(), onDiscardShared: vi.fn(), onShare: vi.fn(),
    onCategory: vi.fn(), onActivate: vi.fn(), onRemove: vi.fn(), onRetry: vi.fn(),
    onClear: vi.fn(), onAdd: vi.fn(), onClose: vi.fn(),
  };
});

afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(storageRead).not.toHaveBeenCalled();
  expect(storageWrite).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("T10 home comparison presentation", () => {
  it("exposes parent focus targets and a bottom map overlay without becoming a modal", () => {
    render();
    const root = elements(tree)[0];
    expect(root.type).toBe("section");
    expect(root.props).toMatchObject({ role: "region", "aria-label": "Home comparison", tabIndex: -1,
      "data-comparison-panel": true, "data-map-overlay": "bottom" });
    expect(button("Close comparison").props["data-comparison-close"]).toBe(true);
    expect(elements(tree).some(node => node.type === "h2" && text(node) === "Compare homes")).toBe(true);
  });

  it("renders actual bus values aligned in a native table with row and column headers", () => {
    render();
    expect(cells("Walk distance")).toEqual(["81 m"]);
    expect(cells("Covered")).toEqual(["55%"]);
    expect(cells("Uncovered")).toEqual(["37 m"]);
    expect(cells("Longest gap")).toEqual(["20 m"]);
    expect(cells("Destination")[0]).toContain(props.entries[realPostal].row!.destination);
    expect(elements(tree).filter(node => node.type === "table")).toHaveLength(1);
    expect(elements(tree).filter(node => node.type === "th" && node.props.scope === "col")).toHaveLength(2);
    expect(text(tree)).toContain("Published default sheltered walks");
  });

  it("uses the actual MRT Exit E category default, not a shorter candidate", () => {
    props.state = { ...props.state, category: "mrt_lrt" };
    props.entries = { [realPostal]: entry(realPostal, "mrt_lrt") };
    render();
    expect(cells("Destination")).toEqual(["BAYFRONT MRT STATION Exit E"]);
    expect(cells("Walk distance")).toEqual(["308 m"]);
    expect(cells("Covered")).toEqual(["24%"]);
    expect(cells("Uncovered")).toEqual(["234 m"]);
    expect(cells("Longest gap")).toEqual(["136 m"]);
  });

  it("preserves insertion order and aligns three homes without a winner or ranking", () => {
    props.state = { ...props.state, postals: [thirdPostal, realPostal, secondPostal], activePostal: realPostal };
    props.entries = { [realPostal]: entry(), [secondPostal]: entry(secondPostal), [thirdPostal]: entry(thirdPostal) };
    render();
    expect(cells("Walk distance")).toEqual(["Unavailable", "81 m", "Unavailable"]);
    const headers = elements(tree).filter(node => node.type === "th" && node.props.scope === "col").slice(1).map(text);
    expect(headers.map(value => value.slice(0, 6))).toEqual([thirdPostal, realPostal, secondPostal]);
    expect(button("Add postal").props.disabled).toBe(true);
    expect(text(tree)).not.toMatch(/winner|rank|best home|overall score/i);
  });

  it("defensively bounds malformed oversized inputs to three visible columns", () => {
    props.state = { ...props.state, postals: [realPostal, secondPostal, thirdPostal, "001001"] };
    render();
    expect(elements(tree).filter(node => node.type === "th" && node.props.scope === "col")).toHaveLength(4);
    expect(text(tree)).not.toContain("001001");
  });

  it("keeps add and category actions available in the initial empty state", () => {
    props.state = emptyComparisonState(); props.entries = {};
    render();
    expect(text(tree)).toContain("No homes added.");
    expect(elements(tree).some(node => node.type === "table")).toBe(false);
    expect(button("Clear list").props.disabled).toBe(true);
    click("Add postal"); click("Bus");
    expect(props.onAdd).toHaveBeenCalledTimes(1);
    expect(props.onCategory).toHaveBeenCalledExactlyOnceWith("bus");
  });

  it("calls close and clear only through their actual button handlers", () => {
    render();
    expect(props.onClose).not.toHaveBeenCalled(); expect(props.onClear).not.toHaveBeenCalled();
    click("Close comparison"); click("Clear list");
    expect(props.onClose).toHaveBeenCalledTimes(1); expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it("Escape closes the region without allowing the same event to close another surface", () => {
    render();
    const stopPropagation = vi.fn();
    elements(tree)[0].props.onKeyDown!({ key: "Enter", stopPropagation });
    expect(props.onClose).not.toHaveBeenCalled();
    elements(tree)[0].props.onKeyDown!({ key: "Escape", stopPropagation });
    expect(props.onClose).toHaveBeenCalledTimes(1); expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("uses common-category pressed states and dispatches exact categories", () => {
    render();
    expect(button("Bus").props["aria-pressed"]).toBe(true);
    expect(button("MRT/LRT").props["aria-pressed"]).toBe(false);
    click("MRT/LRT");
    expect(props.onCategory).toHaveBeenCalledExactlyOnceWith("mrt_lrt");
  });

  it("labels only the active mapped postal, never another available column", () => {
    props.state = { ...props.state, postals: [secondPostal, realPostal] };
    props.entries = { [realPostal]: entry(), [secondPostal]: entry(secondPostal) };
    render();
    const headerText = () => text(elements(tree).find(node => node.type === "header"));
    expect(headerText()).toContain(`Map: ${realPostal}`);
    props.state = { ...props.state, activePostal: secondPostal };
    render();
    expect(headerText()).not.toContain("Map:");
  });

  it.each(["loading", "error", "missing", "no-option", "unavailable"] as const)("hides mapped identity when the active sheltered route is %s", mode => {
    const value = entry(realPostal, "bus", mode !== "missing");
    if (mode === "loading" || mode === "error") value.geometryStatus = mode;
    if (mode === "no-option") value.option = null;
    if (mode === "unavailable") value.row = { ...value.row!, availability: "unavailable", reason: "evidence_conflict" };
    props.entries = { [realPostal]: value };
    render();
    expect(text(elements(tree).find(node => node.type === "header"))).not.toContain("Map:");
  });

  it("activates and removes by postal identity rather than column position", () => {
    render();
    expect(button(`Show postal ${realPostal} on map`).props["aria-pressed"]).toBe(true);
    click(`Show postal ${realPostal} on map`); click(`Remove postal ${realPostal}`);
    expect(props.onActivate).toHaveBeenCalledExactlyOnceWith(realPostal);
    expect(props.onRemove).toHaveBeenCalledExactlyOnceWith(realPostal);
  });

  it("uses each postal as its single map command beside remove, including unavailable homes", () => {
    props.state = { ...props.state, postals: [realPostal, secondPostal] };
    props.entries = { [realPostal]: entry(), [secondPostal]: entry(secondPostal) };
    render();
    for (const postal of props.state.postals) {
      const mapButton = button(`Show postal ${postal} on map`);
      expect(text(mapButton)).toBe(postal);
      expect(mapButton.props.title).toBe(`Show postal ${postal} on map`);
      const header = elements(tree).find(node => node.type === "th" && node.props.scope === "col" &&
        elements(node).includes(mapButton));
      expect(header).toBeDefined();
      expect(elements(header).filter(node => node.type === "button")).toHaveLength(2);
    }
    expect(button(`Show postal ${secondPostal} on map`).props.disabled).toBe(true);
    expect(text(tree)).not.toContain("Show on map");
  });

  it("keeps the visible add command compact without losing its accessible name", () => {
    render();
    const add = button("Add postal");
    expect(text(add)).toBe("Add");
    expect(add.props.title).toBe("Add postal");
    click("Add postal");
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, "loading"] as const)("shows loading rather than zero for a %s entry", status => {
    props.entries = status ? { [realPostal]: { ...entry(), status, row: null, option: null } } : {};
    render();
    expect(cells("Walk distance")).toEqual(["Loading..."]);
    expect(cells("Covered")).toEqual(["Loading..."]);
    expect(text(tree)).toContain("Loading walk...");
    expect(button(`Show postal ${realPostal} on map`).props.disabled).toBe(true);
  });

  it("a failed column offers its own retry without hiding another home's values", () => {
    props.state = { ...props.state, postals: [realPostal, secondPostal] };
    props.entries = { [realPostal]: entry(), [secondPostal]: { ...entry(secondPostal), status: "error" } };
    render();
    expect(cells("Walk distance")).toEqual(["81 m", "Unavailable"]);
    expect(text(tree)).toContain("Could not load this walk.");
    click(`Retry postal ${secondPostal}`);
    expect(props.onRetry).toHaveBeenCalledExactlyOnceWith(secondPostal);
    expect(button(`Show postal ${secondPostal} on map`).props.disabled).toBe(true);
  });

  it.each(["loading", "error"] as const)("geometry %s retains measurements without claiming a drawable map", geometryStatus => {
    props.entries = { [realPostal]: { ...entry(realPostal, "bus", false), geometryStatus } };
    render();
    expect(cells("Walk distance")).toEqual(["81 m"]);
    expect(cells("Uncovered")).toEqual(["37 m"]);
    expect(text(tree)).toContain(geometryStatus === "loading" ? "Map loading." : "Map unavailable.");
    expect(button(`Show postal ${realPostal} on map`).props.disabled).toBe(true);
    if (geometryStatus === "error") {
      expect(text(button(`Retry postal ${realPostal}`))).toBe("Retry map");
      click(`Retry postal ${realPostal}`);
      expect(props.onRetry).toHaveBeenCalledExactlyOnceWith(realPostal);
    }
  });

  it("missing drawing remains distinct from a failed fetch", () => {
    props.entries = { [realPostal]: entry(realPostal, "bus", false) };
    render();
    expect(text(tree)).toContain("Route drawing unavailable.");
    expect(elements(tree).some(node => node.type === "button" && node.props["aria-label"] === `Retry postal ${realPostal}`)).toBe(false);
    expect(cells("Covered")).toEqual(["55%"]);
  });

  it("synthetic partial geometry is explicitly partial and still supports map activation", () => {
    const value = entry();
    value.row = { ...value.row!, availability: "partial", reason: "geometry_incomplete",
      evidence: { ...value.row!.evidence, geometryStatus: "partial" } };
    value.option = { ...value.option!, geometry: { ...value.option!.geometry,
      sheltered: { ...value.option!.geometry.sheltered, status: "partial" } } };
    props.entries = { [realPostal]: value };
    render();
    expect(text(tree)).toContain("Only part of the walk can be shown.");
    click(`Show postal ${realPostal} on map`);
    expect(props.onActivate).toHaveBeenCalledExactlyOnceWith(realPostal);
  });

  it("synthetic missing metrics are not rendered as zero and do not erase known coverage", () => {
    const value = entry();
    value.row = { ...value.row!, availability: "partial", reason: "metrics_incomplete",
      metrics: { distance: null, coverage: 0, uncovered: null, longest: null } };
    props.entries = { [realPostal]: value };
    render();
    expect(cells("Walk distance")).toEqual(["Unavailable"]);
    expect(cells("Covered")).toEqual(["0%"]);
    expect(cells("Uncovered")).toEqual(["Unavailable"]);
    expect(text(tree)).toContain("Some measurements unavailable.");
  });

  it("explicit zero gaps remain zero", () => {
    const value = entry();
    value.row = { ...value.row!, metrics: { ...value.row!.metrics, uncovered: 0, longest: 0 } };
    props.entries = { [realPostal]: value };
    render();
    expect(cells("Uncovered")).toEqual(["0 m"]); expect(cells("Longest gap")).toEqual(["0 m"]);
  });

  it("conflicting evidence never displays metrics or enables map focus", () => {
    const value = entry();
    value.row = { ...value.row!, availability: "unavailable", reason: "evidence_conflict" };
    props.entries = { [realPostal]: value };
    render();
    expect(text(tree)).toContain("Walk evidence conflicts.");
    expect(cells("Walk distance")).toEqual(["Unavailable"]);
    expect(button(`Show postal ${realPostal} on map`).props.disabled).toBe(true);
  });

  it.each(["postal", "category"] as const)("does not present a mismatched %s row as current evidence", field => {
    const value = entry();
    value.row = { ...value.row!, [field]: field === "postal" ? secondPostal : "mrt_lrt" };
    props.entries = { [realPostal]: value };
    render();
    expect(cells("Walk distance")).toEqual(["Unavailable"]);
    expect(text(tree)).toContain("Walk evidence unavailable.");
    expect(button(`Show postal ${realPostal} on map`).props.disabled).toBe(true);
  });

  it("reports storage failure briefly without disabling ordinary commands", () => {
    props.storageUnavailable = true;
    render();
    expect(text(tree)).toContain("Saved for this visit only.");
    click("Add postal"); click("Clear list");
    expect(props.onAdd).toHaveBeenCalledTimes(1); expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it("does not show a storage warning when persistence is available", () => {
    render();
    expect(text(tree)).not.toContain("Saved for this visit only.");
  });

  it("escapes destination content and keeps controls native keyboard-focusable buttons", () => {
    const value = entry();
    value.row = { ...value.row!, destination: '<script>alert("synthetic")</script>' };
    props.entries = { [realPostal]: value };
    render();
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
    expect(elements(tree).filter(node => node.type === "button").every(node => node.props.type === "button" && node.props.tabIndex !== -1)).toBe(true);
    const viewport = elements(tree).find(node => node.props["aria-label"] === "Compared walks");
    expect(viewport?.props.tabIndex).toBe(0);
  });

  it("retains parent state and source entries unchanged without automatic actions", () => {
    const before = structuredClone({ state: props.state, entries: props.entries });
    render(); render();
    expect({ state: props.state, entries: props.entries }).toEqual(before);
    for (const handler of [props.onCategory, props.onActivate, props.onRemove, props.onRetry, props.onClear, props.onAdd, props.onClose,
      props.onShare, props.onSaveShared, props.onDiscardShared]) {
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it("defines bounded scroll dimensions and wrapping without claiming browser pixel acceptance", () => {
    props.state = { ...props.state, postals: [realPostal, secondPostal, thirdPostal] };
    render();
    const table = elements(tree).find(node => node.type === "table");
    expect(table?.props.style?.minWidth).toBe("640px");
    const css = readFileSync(resolve(process.cwd(), "components/home-comparison.module.css"), "utf8");
    expect(css).toContain("max-height: 46dvh"); expect(css).toContain("overflow: auto");
    expect(css).toMatch(/\.panel\s*\{[^}]*bottom:\s*32px/);
    expect(css).toMatch(/\.table thead th\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*2;/);
    expect(css).toMatch(/\.table thead th:first-child\s*\{[^}]*z-index:\s*3;/);
    expect(css).toMatch(/\.panel\s*\{[^}]*scroll-padding-inline-start:\s*112px;/);
    expect(css).toContain("min-height: 44px"); expect(css).toContain("white-space: normal");
    expect(css).not.toMatch(/font-size:\s*[^;]*(?:vw|vh)|letter-spacing:\s*-/);
  });

  it("keeps one scroll owner so enlarged comparison controls cannot collapse the table", () => {
    const css = readFileSync(resolve(process.cwd(), "components/home-comparison.module.css"), "utf8");
    expect(css).toMatch(/\.panel\s*\{[^}]*overflow:\s*auto;[^}]*overscroll-behavior:\s*contain;/);
    expect(css).toMatch(/\.tableViewport\s*\{[^}]*flex:\s*0 0 auto;[^}]*overflow:\s*visible;/);
    expect(css).toContain(".panel:has(.tableViewport:focus-visible)");
    // Structural guard only: browser receipts establish scroll, focus and pixel acceptance.
    expect(css).toMatch(/\.header,\s*\.toolbar,\s*\.sharedRow,\s*\.storageNote,\s*\.empty\s*\{[^}]*position:\s*sticky;[^}]*left:\s*0;/);
  });
});

describe("T11 comparison share commands", () => {
  it.each(["Save shortlist on this device", "Use my saved shortlist"])("returns focused %s to Share when shared mode ends", name => {
    props.shared = true; render();
    focusDocument.activeElement = mountedButtons.get(name);
    click(name);
    expect(focusedByComponent).toEqual([]);
    props.shared = false; render();
    expect(focusedByComponent).toEqual(["Share comparison"]);
  });

  it("returns to Close if using the saved shortlist leaves no homes to share", () => {
    props.shared = true; render();
    focusDocument.activeElement = mountedButtons.get("Use my saved shortlist");
    click("Use my saved shortlist");
    props.shared = false; props.state = emptyComparisonState(); props.entries = {}; render();
    expect(focusedByComponent).toEqual(["Close comparison"]);
  });

  it("does not steal outside focus when the shared action completes", () => {
    props.shared = true; render();
    focusDocument.activeElement = mountedButtons.get("Save shortlist on this device");
    click("Save shortlist on this device");
    const outside = {}; focusDocument.activeElement = outside;
    props.shared = false; render();
    expect(focusDocument.activeElement).toBe(outside); expect(focusedByComponent).toEqual([]);
  });

  it("offers compact Add, Share and Clear with full accessible command names", () => {
    render();
    expect(text(button("Add postal"))).toBe("Add");
    expect(text(button("Share comparison"))).toBe("Share");
    expect(text(button("Clear list"))).toBe("Clear");
    expect(props.onShare).not.toHaveBeenCalled();
    click("Share comparison");
    expect(props.onShare).toHaveBeenCalledTimes(1);
  });

  it("disables sharing an empty list without disabling Add", () => {
    props.state = emptyComparisonState(); props.entries = {};
    render();
    expect(button("Share comparison").props.disabled).toBe(true);
    expect(button("Add postal").props.disabled).not.toBe(true);
  });

  it("keeps sharing available when the three-home limit disables Add", () => {
    props.state = { ...props.state, postals: [realPostal, secondPostal, thirdPostal] };
    render();
    expect(button("Add postal").props.disabled).toBe(true);
    click("Share comparison");
    expect(props.onShare).toHaveBeenCalledTimes(1);
  });

  it("shows shared mode without claiming it has been saved or invoking either choice automatically", () => {
    props.shared = true;
    render();
    expect(text(tree)).toContain("Shared shortlist");
    expect(text(button("Save shortlist on this device"))).toBe("Save");
    expect(text(button("Use my saved shortlist"))).toBe("Use saved");
    expect(text(tree)).not.toContain("Shortlist saved");
    expect(props.onSaveShared).not.toHaveBeenCalled();
    expect(props.onDiscardShared).not.toHaveBeenCalled();
    click("Save shortlist on this device"); click("Use my saved shortlist");
    expect(props.onSaveShared).toHaveBeenCalledTimes(1);
    expect(props.onDiscardShared).toHaveBeenCalledTimes(1);
  });

  it("does not render shared-save controls for an ordinary local shortlist", () => {
    render();
    expect(text(tree)).not.toContain("Shared shortlist");
    expect(elements(tree).some(node => node.props["aria-label"] === "Save shortlist on this device")).toBe(false);
  });
});

describe("T10 comparison removal focus ownership", () => {
  beforeEach(() => {
    props.state = { ...props.state, postals: [realPostal, secondPostal, thirdPostal] };
  });

  it.each([
    [realPostal, secondPostal], [secondPostal, thirdPostal], [thirdPostal, secondPostal],
  ])("removing focused %s moves to the nearest remaining remove button %s", (removed, expected) => {
    render();
    focusDocument.activeElement = mountedButtons.get(`Remove postal ${removed}`);
    click(`Remove postal ${removed}`);
    expect(focusedByComponent).toEqual([]);
    props.state = transitionComparison(props.state, { type: "remove", postal: removed }).state;
    render();
    expect(focusedByComponent).toEqual([`Remove postal ${expected}`]);
    expect(focusDocument.activeElement).toBe(mountedButtons.get(`Remove postal ${expected}`));
    render();
    expect(focusedByComponent).toHaveLength(1);
  });

  it("removing the final focused postal transfers focus to close", () => {
    props.state = { ...props.state, postals: [realPostal] };
    render();
    focusDocument.activeElement = mountedButtons.get(`Remove postal ${realPostal}`);
    click(`Remove postal ${realPostal}`);
    props.state = transitionComparison(props.state, { type: "remove", postal: realPostal }).state;
    render();
    expect(focusedByComponent).toEqual(["Close comparison"]);
  });

  it("an unfocused remove action does not steal external focus", () => {
    render();
    const outside = {};
    focusDocument.activeElement = outside;
    click(`Remove postal ${realPostal}`);
    props.state = transitionComparison(props.state, { type: "remove", postal: realPostal }).state;
    render();
    expect(focusDocument.activeElement).toBe(outside);
    expect(focusedByComponent).toEqual([]);
  });

  it("does not reclaim focus moved outside after the request but before removal commits", () => {
    render();
    focusDocument.activeElement = mountedButtons.get(`Remove postal ${realPostal}`);
    click(`Remove postal ${realPostal}`);
    const outside = {};
    focusDocument.activeElement = outside;
    props.state = transitionComparison(props.state, { type: "remove", postal: realPostal }).state;
    render();
    expect(focusDocument.activeElement).toBe(outside);
    expect(focusedByComponent).toEqual([]);
  });

  it("ordinary entry, category and selection updates do not move focus", () => {
    render();
    const focused = mountedButtons.get(`Remove postal ${secondPostal}`);
    focusDocument.activeElement = focused;
    props.state = { ...props.state, postals: [...props.state.postals], category: "mrt_lrt", activePostal: secondPostal };
    props.entries = {}; props.storageUnavailable = true;
    render();
    expect(focusDocument.activeElement).toBe(focused);
    expect(focusedByComponent).toEqual([]);
  });

  it("a removal rejected by the parent does not move focus or later redirect an unrelated deletion", () => {
    render();
    const original = mountedButtons.get(`Remove postal ${realPostal}`);
    focusDocument.activeElement = original;
    click(`Remove postal ${realPostal}`);
    render();
    props.state = transitionComparison(props.state, { type: "remove", postal: secondPostal }).state;
    render();
    expect(focusDocument.activeElement).toBe(original);
    expect(focusedByComponent).toEqual([]);
  });

  it("clearing with keyboard focus on the now-disabled clear button focuses close", () => {
    render();
    focusDocument.activeElement = mountedButtons.get("Clear list");
    click("Clear list");
    props.state = transitionComparison(props.state, { type: "reset" }).state;
    render();
    expect(button("Clear list").props.disabled).toBe(true);
    expect(focusedByComponent).toEqual(["Close comparison"]);
  });

  it("clearing without ownership does not steal focus", () => {
    render();
    const outside = {};
    focusDocument.activeElement = outside;
    click("Clear list");
    props.state = transitionComparison(props.state, { type: "reset" }).state;
    render();
    expect(focusDocument.activeElement).toBe(outside);
    expect(focusedByComponent).toEqual([]);
  });
});

describe("T03 comparison diagnostic wiring", () => {
  const scoreFailure: ArtifactFailure = {
    stage: "artifact-fetch", reason: "http", artifactRole: "score-shard", httpStatus: 503, elapsedMs: 24,
  };
  const geometryFailure: ArtifactFailure = {
    stage: "artifact-decode", reason: "error", artifactRole: "geometry-shard", httpStatus: null, elapsedMs: 9,
  };
  function diagnostics(): FailureDiagnosticsControlProps[] {
    return elements(tree).flatMap(node => node.type === FailureDiagnosticsControl &&
      React.isValidElement<FailureDiagnosticsControlProps>(node) ? [node.props] : []);
  }

  it("passes only each failing column's typed data to its role-specific control", () => {
    props.diagnosticDataBase = `/data/${bundle}/`;
    props.state = { ...props.state, postals: [realPostal, secondPostal] };
    props.entries = {
      [realPostal]: { ...entry(), requestKey: 7, geometryStatus: "error", geometryFailure },
      [secondPostal]: { ...entry(secondPostal), requestKey: 8, status: "error", scoreFailure },
    };
    render();
    const controls = diagnostics();
    expect(controls.map(control => control.snapshotKey)).toEqual(["7:geometry", "8:score"]);
    expect(JSON.parse(controls[0].value)).toMatchObject({ area: "geometry-data", status: "error", stage: "artifact-decode",
      reason: "error", artifact_role: "geometry-shard", http_status: null, elapsed_ms: 9, artifact_bundle_id: bundle });
    expect(JSON.parse(controls[1].value)).toMatchObject({ area: "score-data", status: "error", stage: "artifact-fetch",
      reason: "http", artifact_role: "score-shard", http_status: 503, elapsed_ms: 24, artifact_bundle_id: bundle });
    expect(cells("Walk distance")).toEqual(["81 m", "Unavailable"]);
    for (const control of controls) {
      expect(control.value).not.toContain(realPostal);
      expect(control.value).not.toContain(secondPostal);
      expect(control.value).not.toContain("Bayfront");
      expect(control.value).not.toContain("requestKey");
    }
  });

  it("keeps simultaneous score and geometry errors distinct beside their actual messages", () => {
    props.entries = { [realPostal]: { ...entry(), requestKey: 11, status: "error", geometryStatus: "error", scoreFailure, geometryFailure } };
    render();
    expect(text(tree)).toContain("Could not load this walk.");
    expect(text(tree)).toContain("Map unavailable.");
    expect(diagnostics().map(control => control.snapshotKey)).toEqual(["11:score", "11:geometry"]);
    for (const label of ["Walk data failure", "Map data failure"]) {
      const group = elements(tree).find(node => node.props.role === "group" && node.props["aria-label"] === label);
      expect(group).toBeDefined();
      expect(elements(group).filter(node => node.type === FailureDiagnosticsControl)).toHaveLength(1);
    }
  });

  it("uses unknown failure and bundle identity when optional metadata and data base are absent", () => {
    props.entries = { [realPostal]: { ...entry(), status: "error" } };
    render();
    expect(diagnostics()).toHaveLength(1);
    expect(JSON.parse(diagnostics()[0].value)).toMatchObject({ area: "score-data", stage: "unknown", reason: "unknown",
      artifact_role: null, http_status: null, elapsed_ms: null, artifact_bundle_id: null, artifact_identity_source: "unavailable" });
  });

  it.each(["loading", "ready"] as const)("does not expose stale metadata on %s entries", status => {
    props.entries = { [realPostal]: { ...entry(), status, geometryStatus: status, scoreFailure, geometryFailure } };
    render();
    expect(diagnostics()).toEqual([]);
  });

  it("does not turn unpublished drawing or unavailable metrics into a transport diagnostic", () => {
    props.entries = { [realPostal]: entry(realPostal, "bus", false) };
    render();
    expect(text(tree)).toContain("Route drawing unavailable.");
    expect(diagnostics()).toEqual([]);
    props.entries = { [realPostal]: { ...entry(), row: { ...entry().row!, availability: "unavailable", reason: "metrics_unavailable" } } };
    render();
    expect(diagnostics()).toEqual([]);
  });

  it("drops controls during retry and changes ownership even when the next error payload is identical", () => {
    props.entries = { [realPostal]: { ...entry(), requestKey: 17, status: "error", scoreFailure } };
    render();
    const previous = diagnostics()[0];
    props.entries = { [realPostal]: { ...entry(), requestKey: 18, status: "loading", geometryStatus: "loading" } };
    render(); expect(diagnostics()).toEqual([]);
    props.entries = { [realPostal]: { ...entry(), requestKey: 18, status: "error", scoreFailure } };
    render();
    expect(diagnostics()[0].value).toBe(previous.value);
    expect(diagnostics()[0].snapshotKey).not.toBe(previous.snapshotKey);
  });

  it("does not render failures from a removed or foreign-identity entry", () => {
    props.entries = { [realPostal]: { ...entry(), postal: secondPostal, status: "error", scoreFailure } };
    render(); expect(diagnostics()).toEqual([]);
    props.entries = { [realPostal]: { ...entry(), status: "error", scoreFailure } };
    props.state = emptyComparisonState();
    render(); expect(diagnostics()).toEqual([]);
  });

  it("gives a geometry fetch failure an explicit message even when no comparison row is usable", () => {
    props.entries = { [realPostal]: { ...entry(), row: null, option: null, geometryStatus: "error", geometryFailure } };
    render();
    expect(text(tree)).toContain("Walk evidence unavailable.");
    expect(text(tree)).toContain("Map unavailable.");
    expect(diagnostics().map(control => control.snapshotKey)).toEqual(["1:geometry"]);
  });
});
