import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transitPoiPopupHtml } from "../transit-popup";

// Exercise the component's actual popup bindings with deterministic effects and
// DOM/MapLibre doubles. Native disclosure keyboard behavior needs browser QA.
const hooks = vi.hoisted(() => {
  let index = 0, dirty = false;
  const slots: any[] = [], effects: (() => void)[] = [];
  const changed = (a: unknown[] | undefined, b: unknown[]) =>
    !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  return {
    begin() { index = 0; dirty = false; },
    flush() { effects.splice(0).forEach(run => run()); return dirty; },
    reset() { slots.length = 0; effects.length = 0; },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    useRef(value: unknown) { const i = index++; return slots[i] ??= { current: value }; },
    useState(initial: any) {
      const i = index++, slot = slots[i] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slot.value, (update: any) => {
        const value = typeof update === "function" ? update(slot.value) : update;
        if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; }
      }];
    },
    useMemo(make: () => unknown, deps: unknown[]) {
      const i = index++;
      if (changed(slots[i]?.deps, deps)) slots[i] = { value: make(), deps };
      return slots[i].value;
    },
    useEffect(effect: () => void | (() => void), deps: unknown[]) {
      const i = index++, old = slots[i];
      if (!changed(old?.deps, deps)) return;
      const slot = slots[i] = { deps, cleanup: old?.cleanup };
      effects.push(() => { slot.cleanup?.(); slot.cleanup = effect(); });
    },
  };
});
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), ...hooks }));
const lib = vi.hoisted(() => ({ map: null as any, popups: [] as any[] }));
vi.mock("maplibre-gl", () => ({
  Map: class { constructor() { return lib.map; } },
  Popup: class {
    content?: ElementDouble;
    coordinates?: number[];
    remove = vi.fn();
    constructor(readonly options: unknown) { lib.popups.push(this); }
    setLngLat = vi.fn((coordinates: number[]) => { this.coordinates = coordinates; return this; });
    setDOMContent(content: ElementDouble) { this.content = content; return this; }
    addTo() { return this; }
  },
  setWorkerUrl: vi.fn(), addProtocol: vi.fn(),
}));
import { RouteEvidenceMap } from "../../components/route-evidence-map";

class ElementDouble {
  children: ElementDouble[] = [];
  parent?: ElementDouble;
  attributes = new Map<string, string>();
  listeners = new Map<string, (event: { stopPropagation: () => void }) => void>();
  className = "";
  textContent = "";
  type = "";
  open = false;
  tabIndex = -1;
  html = "";
  constructor(readonly tagName: string) {}
  set innerHTML(html: string) {
    this.html = html;
    // Model only the formatter's optional dl node; do not emulate HTML parsing.
    if (html.includes("<dl ")) this.append(new ElementDouble("dl"));
  }
  get innerHTML() { return this.html; }
  append(...children: ElementDouble[]) {
    for (const child of children) {
      if (child.parent) child.parent.children = child.parent.children.filter(node => node !== child);
      child.parent = this;
      this.children.push(child);
    }
  }
  querySelector(tag: string): ElementDouble | null {
    for (const child of this.children) {
      if (child.tagName === tag) return child;
      const nested = child.querySelector(tag);
      if (nested) return nested;
    }
    return null;
  }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  addEventListener(name: string, listener: (event: { stopPropagation: () => void }) => void) {
    this.listeners.set(name, listener);
  }
}

function fakeMap() {
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  const sources = new Map<string, any>(), layers = new Map<string, any>();
  const canvas = { style: { cursor: "" }, setAttribute: vi.fn() };
  const map = {
    on(event: string, ...args: any[]) {
      const key = args.length === 2 ? `${event}:${args[0]}` : event;
      const set = handlers.get(key) ?? new Set(); set.add(args.at(-1)); handlers.set(key, set); return map;
    },
    off(event: string, listener: (...args: any[]) => void) { handlers.get(event)?.delete(listener); },
    emit(event: string, value = {}) { [...(handlers.get(event) ?? [])].forEach(listener => listener(value)); },
    getSource: (id: string) => sources.get(id), getLayer: (id: string) => layers.get(id),
    addSource(id: string, spec: unknown) { sources.set(id, { spec, setData: vi.fn() }); },
    addLayer(spec: { id: string }) { layers.set(spec.id, spec); },
    getCanvas: () => canvas, getZoom: () => 16, isSourceLoaded: () => true,
    queryRenderedFeatures: vi.fn(() => [] as any[]), moveLayer: vi.fn(),
    setLayoutProperty: vi.fn(), setFilter: vi.fn(), remove: vi.fn(() => handlers.clear()),
  };
  return map;
}

type Props = ComponentProps<typeof RouteEvidenceMap>;
let map: ReturnType<typeof fakeMap>, props: Props, tree: ReturnType<typeof RouteEvidenceMap>;
const container = { closest: () => ({ querySelectorAll: () => [] }) };
function render(update: Partial<Props> = {}) {
  props = { ...props, ...update };
  let again = true, passes = 0;
  while (again) {
    if (++passes > 20) throw new Error("Unbounded component effect loop");
    hooks.begin();
    tree = RouteEvidenceMap(props);
    tree.props.children[0].props.ref.current = container;
    again = hooks.flush();
  }
}
function clickPoi(properties: Record<string, unknown>, layer = "bus-stop-hit") {
  map.emit(`click:${layer}`, {
    features: [{ properties, geometry: { type: "Point", coordinates: [103.85, 1.29] } }],
  });
  return lib.popups.at(-1).content as ElementDouble;
}
const bus = {
  kind: "bus_stop", id: "bus-54211", name: "OPP MAYFLOWER SEC SCH", code: "54211",
  services: "71, 76, 262", weekday_first_bus: "05:45", weekday_last_bus: "00:38",
  am_peak_best_min: 4, pm_peak_best_min: 6, operators: "SBST",
};

beforeEach(async () => {
  vi.useFakeTimers(); hooks.reset(); lib.popups.length = 0;
  map = fakeMap(); lib.map = map;
  props = { routes: [], mode: "shortest", onSelectTransitStop: vi.fn() };
  vi.stubGlobal("window", { location: { search: "" }, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal("document", { createElement: (tag: string) => new ElementDouble(tag) });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Popup interactions must not fetch or retry"); }));
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("MutationObserver", class { observe() {} disconnect() {} });
  render(); await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
  map.emit("load"); render();
});
afterEach(() => {
  try { expect(fetch).not.toHaveBeenCalled(); }
  finally { hooks.unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); }
});

describe("bounded transit map popups", () => {
  it("retains the stop title/type and moves every secondary row behind a closed native disclosure", () => {
    const content = clickPoi(bus);
    expect(content.innerHTML).toBe(transitPoiPopupHtml(bus));
    expect(content.innerHTML).toContain("Opp Mayflower Sec Sch");
    expect(content.innerHTML).toContain("Bus stop");
    expect(content.children.map(child => child.tagName)).toEqual(["details"]);
    const details = content.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(details.children.map(child => child.tagName)).toEqual(["summary", "dl"]);
    expect(details.children[0].textContent).toBe("Service details");
    expect(details.children[0].tabIndex).toBe(0);
    expect(details.children[1].tabIndex).toBe(0);
    expect(details.children[1].attributes.get("aria-label")).toBe("Service details");
    expect(content.innerHTML).toContain("71, 76, 262");
    expect(content.innerHTML).toContain("05:45");
    expect(content.innerHTML).toContain("00:38");
    expect(content.innerHTML).toContain("4 min best scheduled");
    expect(content.innerHTML).toContain("6 min best scheduled");
  });

  it.each(["mrt_station", "mrt_exit"])("keeps %s identity while collapsing station rows", kind => {
    const content = clickPoi({ kind, id: kind, name: "MAYFLOWER MRT STATION EXIT 5", station_codes: "TE6" });
    expect(content.innerHTML).toContain("Mayflower MRT Station Exit 5");
    expect(content.innerHTML).toContain(kind === "mrt_station" ? "MRT/LRT station" : "MRT/LRT exit");
    expect(content.querySelector("summary")?.textContent).toBe("Station details");
    expect(content.querySelector("details")?.open).toBe(false);
  });

  it("omits empty disclosures and never adds a redundant route action", () => {
    const content = clickPoi({ kind: "bus_stop", id: "bus", name: "STOP" });
    expect(content.querySelector("details")).toBeNull();
    expect(content.querySelector("button")).toBeNull();
    expect(content.innerHTML).not.toContain("Walk here");
  });

  it.each([bus.id, undefined, "", 123])("never adds a second selection control for id %s", id => {
    expect(clickPoi({ ...bus, id }).querySelector("button")).toBeNull();
  });

  it("does not offer a route action without a selection callback", () => {
    render({ onSelectTransitStop: undefined });
    expect(clickPoi(bus).querySelector("button")).toBeNull();
  });

  it("preserves the current callback and exact stop id for one map click", () => {
    const original = props.onSelectTransitStop;
    const stopId = 'stop-"<unsafe>&';
    const current = vi.fn();
    render({ onSelectTransitStop: current });
    clickPoi({ ...bus, id: stopId });
    expect(current).not.toHaveBeenCalled();
    map.queryRenderedFeatures.mockReturnValue([{ properties: { id: stopId } }]);
    map.emit("click", { point: { x: 12, y: 34 } });
    expect(original).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledExactlyOnceWith(stopId);
  });

  it("selects exactly once when one marker click hits both the dot and hit target", () => {
    clickPoi(bus, "bus-stop-dot");
    const content = clickPoi(bus, "bus-stop-hit");
    expect(props.onSelectTransitStop).not.toHaveBeenCalled();
    expect(content.querySelector("button")).toBeNull();
    map.queryRenderedFeatures.mockReturnValue([{ properties: bus }, { properties: bus }]);
    map.emit("click", { point: { x: 12, y: 34 } });
    expect(props.onSelectTransitStop).toHaveBeenCalledExactlyOnceWith(bus.id);
    expect(map.queryRenderedFeatures).toHaveBeenCalledOnce();
    render({ chosenStopId: bus.id });
    expect(map.setFilter).toHaveBeenCalledWith("bus-stop-active-ring", [
      "all", ["==", ["get", "kind"], "bus_stop"], ["==", ["get", "id"], bus.id],
    ]);
  });

  it("leaves the existing feedback-mode selection guard in the map click handler", () => {
    const feedback = vi.fn();
    render({ feedbackEnabled: true, onFeedbackPoint: feedback });
    const content = clickPoi(bus);
    map.emit("click", { point: { x: 12, y: 34 }, lngLat: { lng: 103.85, lat: 1.29 } });
    expect(props.onSelectTransitStop).not.toHaveBeenCalled();
    expect(feedback).toHaveBeenCalledExactlyOnceWith({ lng: 103.85, lat: 1.29 });
    expect(content.querySelector("button")).toBeNull();
  });

  it("keeps only one popup when the dot and its hit target receive the same click", () => {
    clickPoi(bus, "bus-stop-dot");
    const first = lib.popups[0];
    clickPoi(bus, "bus-stop-hit");
    expect(first.remove).toHaveBeenCalledOnce();
    expect(lib.popups[1].coordinates).toEqual([103.85, 1.29]);
    expect(lib.popups[1].remove).not.toHaveBeenCalled();
  });

  it("opening and closing details only repositions the popup, without selecting or retrying", () => {
    const content = clickPoi(bus);
    const details = content.querySelector("details")!;
    const popup = lib.popups.at(-1);
    map.queryRenderedFeatures.mockReturnValue([{ properties: bus }]);
    map.emit("click", { point: { x: 12, y: 34 } });
    expect(props.onSelectTransitStop).toHaveBeenCalledExactlyOnceWith(bus.id);
    popup.setLngLat.mockClear();
    for (const open of [true, false, true]) {
      details.open = open;
      details.querySelector("summary")?.listeners.get("click")?.({ stopPropagation: vi.fn() });
      details.listeners.get("toggle")!({ stopPropagation: vi.fn() });
      expect(popup.setLngLat).toHaveBeenLastCalledWith([103.85, 1.29]);
      expect(props.onSelectTransitStop).toHaveBeenCalledExactlyOnceWith(bus.id);
    }
    expect(popup.setLngLat).toHaveBeenCalledTimes(3);
    expect(map.queryRenderedFeatures).toHaveBeenCalledOnce();
    expect(popup.remove).not.toHaveBeenCalled();
    expect(content.listeners.size).toBe(0);
    expect(details.querySelector("summary")?.listeners.size).toBe(0);
    expect([...details.listeners.keys()]).toEqual(["toggle"]);
  });

  it("uses MapLibre's existing close control without a custom dismissal or selection handler", () => {
    const content = clickPoi(bus);
    expect(lib.popups.at(-1).options).toMatchObject({ closeButton: true, offset: 12 });
    expect(content.querySelector("button")).toBeNull();
    expect(props.onSelectTransitStop).not.toHaveBeenCalled();
  });

  it("does not open a popup for non-point features", () => {
    map.emit("click:bus-stop-hit", { features: [{ properties: bus, geometry: { type: "LineString" } }] });
    expect(lib.popups).toHaveLength(0);
  });

  it.each(["bus_stop", "mrt_station", "mrt_exit"])("preserves escaping for all %s fields", kind => {
    const payload = '<details open ontoggle="alert(1)"><img src=x onerror="alert(2)"></details>&';
    const fields = ["name", "code", "road", "services", "service_nos", "service_count",
      "weekday_first_bus", "weekday_last_bus", "operators", "system", "station_codes",
      "lines", "line", "station", "exit", "exit_count"];
    const properties = { kind, id: "safe-id", ...Object.fromEntries(fields.map(field => [field, payload])) };
    const content = clickPoi(properties);
    expect(content.innerHTML).toBe(transitPoiPopupHtml(properties));
    expect(content.innerHTML.toLowerCase()).not.toMatch(/<(?:details|img|script)\b/);
    expect(content.innerHTML.toLowerCase()).toContain("&lt;details");
    expect(content.innerHTML).toContain("&quot;");
    expect(content.innerHTML).toContain("&amp;");
    expect(content.querySelector("summary")?.textContent).not.toContain(payload);
    expect(content.querySelector("details")?.open).toBe(false);
  });

  it("leaves required attribution outside the popup disclosure", () => {
    clickPoi(bus);
    const attribution = tree.props.children[1];
    expect(attribution.props["data-map-overlay"]).toBe("bottom");
    expect(attribution.props.dangerouslySetInnerHTML.__html).toContain('href="https://www.onemap.gov.sg/"');
    expect(attribution.props.dangerouslySetInnerHTML.__html).toContain('href="https://www.sla.gov.sg/"');
    expect(attribution.props.dangerouslySetInnerHTML.__html).toContain("Singapore Land Authority");
  });

  it("styles keyboard focus, touch targets, long text and bounded scrollable details", () => {
    const css = readFileSync(join(__dirname, "../../components/route-evidence-map.module.css"), "utf8");
    expect(css).toContain(".transitPopup :is(summary, dl):focus-visible");
    expect(css).toContain(".mapCanvas :global(.maplibregl-popup-close-button):focus-visible");
    expect(css).toMatch(/\.mapCanvas :global\(\.maplibregl-popup-close-button\)\s*\{[^}]*width: 24px;[^}]*height: 24px;/);
    expect(css).not.toContain(".popupRouteAction");
    expect(css).toMatch(/\.transitPopup summary\s*\{[^}]*min-height: 44px/);
    expect(css).toMatch(/\.transitPopup\s*\{[^}]*overflow-wrap: anywhere/);
    expect(css).toMatch(/\.transitPopup dl\s*\{[^}]*minmax\(0, 1fr\)[^}]*max-height: min\(192px, 30vh\)[^}]*overflow: auto/);
  });
});
