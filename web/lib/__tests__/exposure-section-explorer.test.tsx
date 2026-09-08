import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Execute the actual component and handlers. Native DOM event generation, browser
// focus movement and pixel layout still require the parent's browser acceptance.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  let cursor = 0;
  const slots: Slot[] = [];
  let pending: Array<() => void> = [];
  return {
    begin() { cursor = 0; },
    commit() { const work = pending; pending = []; work.forEach(run => run()); },
    unmount() {
      slots.forEach(slot => slot.cleanup?.());
      slots.length = 0;
      pending = [];
      cursor = 0;
    },
    useState<T>(initial: T): [T, (update: T | ((previous: T) => T)) => void] {
      const slot = slots[cursor++] ??= { value: initial };
      return [slot.value as T, update => {
        slot.value = typeof update === "function"
          ? (update as (previous: T) => T)(slot.value as T) : update;
      }];
    },
    useRef<T>(initial: T): { current: T } {
      const slot = slots[cursor++] ??= { value: { current: initial } };
      return slot.value as { current: T };
    },
    useLayoutEffect(create: () => void | (() => void), deps: readonly unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!slot.deps || slot.deps.length !== deps.length ||
          deps.some((value, index) => !Object.is(value, slot.deps![index]))) {
        slot.deps = deps;
        pending.push(() => {
          slot.cleanup?.();
          slot.cleanup = create() || undefined;
        });
      }
    },
  };
});

vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const hooks = { useState: host.useState, useRef: host.useRef, useLayoutEffect: host.useLayoutEffect };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});

import { ExposureSectionExplorer, type ExposureSectionExplorerProps } from "../../components/exposure-section-explorer";
import { publishedExposureSections, type PublishedExposureSections } from "../published-exposure-sections";
import { normalizePublishedTransitOptions } from "../published-transit-options";
import fixture from "./fixtures/published-options.json";

type Element = ReactElement<{
  children?: ReactNode;
  ref?: { current: unknown };
  onClick?: () => void;
  onToggle?: (event: { target: unknown; currentTarget: { open: boolean } }) => void;
  onKeyDown?: unknown;
  className?: string;
  type?: string;
  tabIndex?: number;
  open?: boolean;
  disabled?: boolean;
  role?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
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
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}

function model(contextKey = "walk-a"): PublishedExposureSections {
  // Synthetic mapped observations exercise UI ordering without inventing a gap map.
  return {
    contextKey,
    status: "available",
    sections: [
      { key: "tail", lengthM: 0.4 },
      { key: "b", lengthM: 50 },
      { key: "long", lengthM: 120.6 },
      { key: "a", lengthM: 50 },
      { key: "zero", lengthM: 0 },
    ].map(section => ({ ...section, encoded: `encoded:${section.key}`, points: [[1.28, 103.85], [1.2801, 103.8501]] as [number, number][] })),
  };
}

let props: ExposureSectionExplorerProps;
let tree: ReactNode;
let mountedKey: string | null;
type DetailsDouble = {
  open: boolean;
  ownerDocument: { activeElement: unknown };
  descendants: Set<unknown>;
  contains: (node: unknown) => boolean;
};
let focusDocument: { activeElement: unknown };
let detail: DetailsDouble;
let summaryNode: { focus: ReturnType<typeof vi.fn> };
let summaryFocus: ReturnType<typeof vi.fn>;
let onSelect: ReturnType<typeof vi.fn>;

function mountNodes() {
  detail = {
    open: false,
    ownerDocument: focusDocument,
    descendants: new Set(),
    contains(node) { return node === this || this.descendants.has(node); },
  };
  summaryFocus = vi.fn(() => { focusDocument.activeElement = summaryNode; });
  summaryNode = { focus: summaryFocus };
  detail.descendants.add(summaryNode);
}

function focusInside() {
  const node = {};
  detail.descendants.add(node);
  focusDocument.activeElement = node;
  return node;
}

function render(next: Partial<ExposureSectionExplorerProps> = {}) {
  props = { ...props, ...next };
  freeze(props.model);
  const before = structuredClone(props.model);
  const wrapper = ExposureSectionExplorer(props);
  const key = wrapper === null ? null : String(wrapper.key);
  if (key !== mountedKey) {
    host.unmount();
    mountedKey = key;
    mountNodes();
  }
  if (wrapper === null) {
    tree = null;
  } else {
    host.begin();
    tree = (wrapper.type as (input: ExposureSectionExplorerProps) => ReactNode)(wrapper.props);
    if (root().props.ref) root().props.ref!.current = detail;
    const summary = elements(tree).find(element => element.type === "summary")!;
    if (summary.props.ref) summary.props.ref.current = summaryNode;
    host.commit();
  }
  expect(props.model).toEqual(before);
  return tree;
}

function root(): Element {
  expect(React.isValidElement(tree)).toBe(true);
  return tree as Element;
}

function sectionButtons() {
  return elements(tree).filter(element => element.type === "button" &&
    typeof element.props["aria-pressed"] === "boolean");
}

function button(label: string): Element {
  const matches = elements(tree).filter(element => element.type === "button" && text(element) === label);
  expect(matches).toHaveLength(1);
  return matches[0];
}

function click(label: string) {
  button(label).props.onClick!();
  render();
}

function toggle(open: boolean) {
  detail.open = open;
  root().props.onToggle!({ target: detail, currentTarget: detail });
  render();
}

beforeEach(() => {
  host.unmount();
  mountedKey = null;
  tree = null;
  focusDocument = { activeElement: null };
  mountNodes();
  onSelect = vi.fn();
  props = { model: model(), selectedKey: null, onSelect, mode: "shiokest" };
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Explorer must not fetch"); }));
});

afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { host.unmount(); vi.unstubAllGlobals(); }
});

describe("ExposureSectionExplorer", () => {
  it("renders a collapsed native disclosure and keyboard-operable buttons without overriding Enter/Space", () => {
    render();
    expect(root().type).toBe("details");
    expect(root().props.open).toBeUndefined();
    const summary = elements(tree).find(element => element.type === "summary")!;
    expect(text(summary)).toBe("Mapped exposed sections (5)");
    expect(summary.props.onKeyDown).toBeUndefined();
    expect(summary.props.tabIndex).toBeUndefined();
    for (const item of elements(tree).filter(element => element.type === "button")) {
      expect(item.props.type).toBe("button");
      expect(item.props.onKeyDown).toBeUndefined();
      expect(item.props.tabIndex).toBeUndefined();
      expect(item.props.disabled).toBeUndefined();
    }
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('role="group" aria-label="Mapped exposed sections"');
    expect(html).not.toMatch(/<details[^>]*\sopen(?:\s|=|>)/);
  });

  it("shows only the longest three source lengths and uses code-unit keys for ties", () => {
    render();
    expect(sectionButtons().map(item => item.key)).toEqual(["long", "a", "b"]);
    expect(sectionButtons().map(text)).toEqual(["Section 1121 m", "Section 250 m", "Section 350 m"]);
    expect(text(tree)).not.toMatch(/total|longest gap|all exposed|all covered/i);
    expect(button("Show more").props["aria-expanded"]).toBe(false);
  });

  it("preserves order across input permutations without mutating the model", () => {
    const initial = model();
    render({ model: initial });
    const keys = sectionButtons().map(item => item.key);
    render({ model: { ...initial, sections: [...initial.sections].reverse() } });
    expect(sectionButtons().map(item => item.key)).toEqual(keys);
  });

  it("expands all sections while retaining the same expansion control", () => {
    render();
    toggle(true);
    click("Show more");
    expect(sectionButtons().map(item => item.key)).toEqual(["long", "a", "b", "tail", "zero"]);
    expect(sectionButtons().map(text).slice(3)).toEqual(["Section 4<1 m", "Section 50 m"]);
    expect(button("Show fewer").props["aria-expanded"]).toBe(true);
    expect(detail.open).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    click("Show fewer");
    expect(sectionButtons()).toHaveLength(3);
    expect(button("Show more").props["aria-expanded"]).toBe(false);
    expect(detail.open).toBe(true);
  });

  it.each([1, 2, 3])("does not add expansion controls for %i sections", count => {
    render({ model: { ...model(), sections: model().sections.slice(0, count) } });
    expect(sectionButtons()).toHaveLength(count);
    expect(text(tree)).not.toMatch(/Show more|Show fewer/);
  });

  it("selects the actual mapped key without collapse, reset or focus stealing", () => {
    render();
    toggle(true);
    click("Show more");
    const section = sectionButtons()[3];
    section.props.onClick!();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("tail");
    render({ selectedKey: "tail" });
    expect(sectionButtons().map(item => item.props["aria-pressed"])).toEqual([false, false, false, true, false]);
    expect(button("Back to walk")).toBeDefined();
    expect(button("Show fewer")).toBeDefined();
    expect(detail.open).toBe(true);
    expect(summaryFocus).not.toHaveBeenCalled();
  });

  it("Back to walk clears once and requests summary focus before its button disappears", () => {
    render({ selectedKey: "long" });
    toggle(true);
    click("Back to walk");
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
    expect(summaryFocus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    render({ selectedKey: null });
    expect(text(tree)).not.toContain("Back to walk");
    expect(detail.open).toBe(true);
  });

  it("closing clears focus, requests summary focus and resets expansion; opening never selects", () => {
    render({ selectedKey: "long" });
    toggle(true);
    expect(onSelect).not.toHaveBeenCalled();
    click("Show more");
    toggle(false);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
    expect(summaryFocus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(sectionButtons()).toHaveLength(3);
    toggle(false);
    expect(onSelect).toHaveBeenCalledTimes(1);
    toggle(true);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("ignores bubbled nested-disclosure toggle events", () => {
    render({ selectedKey: "long" });
    toggle(true);
    detail.open = false;
    root().props.onToggle!({ target: { open: false }, currentTarget: detail });
    expect(onSelect).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
  });

  it("ignores an initial closed notification instead of clearing a parent selection", () => {
    render({ selectedKey: "long" });
    toggle(false);
    expect(onSelect).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
  });

  it("context changes remount the native disclosure, reset expansion and leave selection ownership to the parent", () => {
    render();
    toggle(true);
    click("Show more");
    const oldClick = sectionButtons()[0].props.onClick!;
    const oldToggle = root().props.onToggle!;
    const oldDetail = detail;
    render({ model: model("walk-b"), selectedKey: null });
    expect(detail).not.toBe(oldDetail);
    expect(detail.open).toBe(false);
    expect(sectionButtons()).toHaveLength(3);
    oldClick();
    oldDetail.open = false;
    oldToggle({ target: oldDetail, currentTarget: oldDetail });
    expect(onSelect).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
    render({ model: model("walk-a") });
    oldClick();
    expect(onSelect).not.toHaveBeenCalled();
    expect(sectionButtons()).toHaveLength(3);
  });

  it("an obsolete same-context section callback cannot select a removed section", () => {
    render();
    const removed = sectionButtons()[0].props.onClick!;
    render({ model: { ...model(), sections: model().sections.filter(section => section.key !== "long") } });
    removed();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("same-context retained handlers use the latest parent callback", () => {
    render();
    const retained = sectionButtons()[0].props.onClick!;
    const latest = vi.fn();
    render({ onSelect: latest });
    retained();
    expect(onSelect).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith("long");
  });

  it("stale Back to walk and Show more actions cannot affect a new context", () => {
    render({ selectedKey: "long" });
    const oldBack = button("Back to walk").props.onClick!;
    const oldMore = button("Show more").props.onClick!;
    render({ model: model("walk-b"), selectedKey: null });
    oldBack();
    oldMore();
    render();
    expect(onSelect).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
    expect(sectionButtons()).toHaveLength(3);
  });

  it("does not present a stale unknown key as selected or offer an ineffective reset", () => {
    render({ selectedKey: "foreign-section" });
    expect(sectionButtons().every(item => item.props["aria-pressed"] === false)).toBe(true);
    expect(text(tree)).not.toContain("Back to walk");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(["empty", "unavailable"] as const)("%s has no misleading zero/all-covered claim or section control", status => {
    render({ model: { contextKey: status, status, sections: [] } });
    expect(tree).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("also hides a partial model with no mappable sections", () => {
    render({ model: { contextKey: "partial", status: "partial", sections: [] } });
    expect(tree).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("partial mapping keeps its useful sections with a short sheltered-walk qualifier", () => {
    render({ model: { ...model(), status: "partial" } });
    expect(text(tree)).toContain("Partial mapping.");
    expect(sectionButtons()).toHaveLength(3);
    expect(text(tree)).not.toMatch(/all covered|zero gaps|guarantee|dry|safe/i);
  });

  it("the real fixture's both-mode model is explicitly labelled sheltered, and shortest hides it", () => {
    const postal = "018956";
    const bundle = "generated_20260805_prefer_scored_routed";
    const pool = normalizePublishedTransitOptions({
      bundle, postal, category: "mrt_lrt",
      score: fixture["scores/DOWNTOWN_CORE_PART_001.json"].find(row => row.postal === postal),
      geometry: fixture["geom/h3/886520db39fffff.json"][0],
      scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
    });
    const option = pool.options.find(item => item.category === "mrt_lrt" &&
      item.selectionRef.kind === "category_default")!;
    expect(option).toBeDefined();
    const both = publishedExposureSections(option, "both");
    expect(both.sections.length).toBeGreaterThan(0);
    render({ model: both, mode: "both" });
    expect(text(tree)).toContain("Sheltered walk");
    const previous = sectionButtons()[0].props.onClick!;
    const shortest = publishedExposureSections(option, "shortest");
    expect(shortest.status).toBe("unavailable");
    render({ model: shortest, selectedKey: null, mode: "shortest" });
    expect(tree).toBeNull();
    previous();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("unmount cleanup blocks retained selection handlers", () => {
    render();
    const retained = sectionButtons()[0].props.onClick!;
    host.unmount();
    retained();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("notifies once when a focused disclosure unmounts, without clearing parent selection", () => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    focusInside();
    host.unmount();
    expect(onFocusedRemoval).toHaveBeenCalledExactlyOnceWith();
    expect(onSelect).not.toHaveBeenCalled();
    host.unmount();
    expect(onFocusedRemoval).toHaveBeenCalledTimes(1);
  });

  it("context replacement notifies while the outgoing root still owns focus", () => {
    let outgoing: DetailsDouble;
    let focused: unknown;
    const onFocusedRemoval = vi.fn(() => {
      expect(detail).toBe(outgoing);
      expect(outgoing.ownerDocument.activeElement).toBe(focused);
      expect(outgoing.contains(focused)).toBe(true);
    });
    render({ onFocusedRemoval });
    outgoing = detail;
    focused = focusInside();
    render({ model: model("walk-b") });
    expect(onFocusedRemoval).toHaveBeenCalledExactlyOnceWith();
    expect(detail).not.toBe(outgoing);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(["shortest", "preview"] as const)("replacement with %s notifies only for outgoing owned focus", replacement => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    focusInside();
    render(replacement === "shortest" ? { mode: "shortest" } : {
      model: { contextKey: "preview", status: "unavailable", sections: [] },
    });
    expect(tree).toBeNull();
    expect(onFocusedRemoval).toHaveBeenCalledExactlyOnceWith();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.each(["outside", "none"] as const)("unmount does not steal %s focus", placement => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    focusDocument.activeElement = placement === "outside" ? { label: "About data" } : null;
    host.unmount();
    expect(onFocusedRemoval).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
  });

  it("checks live focus at removal instead of remembering earlier focus ownership", () => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    focusInside();
    const outside = { label: "About data" };
    focusDocument.activeElement = outside;
    render({ model: model("walk-b") });
    expect(onFocusedRemoval).not.toHaveBeenCalled();
    expect(focusDocument.activeElement).toBe(outside);
  });

  it("ordinary selection, callback, model and expansion updates do not run removal notification", () => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    const focused = focusInside();
    render({ selectedKey: "long" });
    render({ onSelect: vi.fn() });
    render({ model: { ...model(), status: "partial" } });
    click("Show more");
    expect(onFocusedRemoval).not.toHaveBeenCalled();
    expect(summaryFocus).not.toHaveBeenCalled();
    expect(focusDocument.activeElement).toBe(focused);
  });

  it("focused removal calls the latest callback even after owner cleanup has run", () => {
    const first = vi.fn();
    const latest = vi.fn();
    render({ onFocusedRemoval: first });
    focusInside();
    render({ onFocusedRemoval: latest, selectedKey: "long" });
    expect(first).not.toHaveBeenCalled();
    expect(latest).not.toHaveBeenCalled();
    host.unmount();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith();
  });

  it("removing the optional callback does not retain an obsolete callback", () => {
    const onFocusedRemoval = vi.fn();
    render({ onFocusedRemoval });
    focusInside();
    render({ onFocusedRemoval: undefined });
    host.unmount();
    expect(onFocusedRemoval).not.toHaveBeenCalled();
  });

  it("missing removal callback is harmless when focus is inside", () => {
    render();
    focusInside();
    expect(() => host.unmount()).not.toThrow();
  });

  it.each(["close", "back"] as const)("explicit %s restores the summary without invoking removal notification", action => {
    const onFocusedRemoval = vi.fn();
    render({ selectedKey: "long", onFocusedRemoval });
    toggle(true);
    focusInside();
    if (action === "close") toggle(false);
    else click("Back to walk");
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
    expect(summaryFocus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(focusDocument.activeElement).toBe(summaryNode);
    expect(onFocusedRemoval).not.toHaveBeenCalled();
  });

  it("shortest mode never exposes a stale sheltered model while the parent replaces it", () => {
    render({ mode: "shortest" });
    expect(tree).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("both mode labels partial sections as belonging to the sheltered walk", () => {
    render({ mode: "both", model: { ...model(), status: "partial" } });
    expect(text(tree)).toContain("Sheltered walk; partial mapping.");
  });

  it("has constrained one-column layout, normal text wrapping and 44px targets without clipping", () => {
    const css = readFileSync(resolve(process.cwd(), "components/exposure-section-explorer.module.css"), "utf8");
    expect(css).toMatch(/\.explorer\s*\{[^}]*width:\s*100%/s);
    expect(css).toMatch(/\.sections\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.summary\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.section,\s*\.action\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/white-space:\s*normal/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).not.toMatch(/white-space:\s*nowrap|text-overflow:\s*ellipsis|overflow(?:-x)?:\s*(?:hidden|clip)|font-size:\s*[^;]*vw|letter-spacing:\s*-/);
    render();
    expect(text(tree).length).toBeLessThan(220);
  });
});
