import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { RouteEvidenceMap } from "../../components/route-evidence-map";

// Execute the component's hooks and cleanup; this host does not render React DOM or WebGL.
const hooks = vi.hoisted(() => {
  let index = 0, dirty = false;
  const slots: any[] = [], effects: (() => void)[] = [];
  const changed = (a: unknown[] | undefined, b: unknown[]) =>
    !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const cleanup = (slot: any) => {
    const run = slot.cleanup;
    slot.cleanup = undefined;
    run?.();
  };
  return {
    begin() { index = 0; dirty = false; },
    flush() { effects.splice(0).forEach(run => run()); return dirty; },
    reset() { slots.length = 0; effects.length = 0; },
    unmount() { slots.forEach(cleanup); },
    replayEffects() {
      slots.filter(slot => slot.effect).forEach(slot => { cleanup(slot); slot.deps = undefined; });
    },
    useRef(value: unknown) { const i = index++; return slots[i] ??= { current: value }; },
    useState(initial: any) {
      const i = index++;
      const slot = slots[i] ??= { value: typeof initial === "function" ? initial() : initial };
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
      const slot = slots[i] = { effect: true, deps, cleanup: old?.cleanup };
      effects.push(() => { cleanup(slot); slot.cleanup = effect(); });
    },
  };
});

vi.mock("react", async original => ({ ...await original<typeof import("react")>(), ...hooks }));

function deferred() {
  let resolve!: () => void;
  let reject!: (failure: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  void promise.catch(() => undefined);
  return { promise, resolve, reject };
}

type Props = ComponentProps<typeof RouteEvidenceMap>;
let Component: typeof RouteEvidenceMap;
let props: Props;
let importGate: ReturnType<typeof deferred>;
let importEntered: ReturnType<typeof deferred>;
let status: ReturnType<typeof vi.fn>;
let construct: ReturnType<typeof vi.fn>;
let moduleMap: ReturnType<typeof incompleteMap>;
const container = {};

function incompleteMap() {
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  const map = {
    handlers,
    on(event: string, listener: (...args: any[]) => void) {
      const listeners = handlers.get(event) ?? new Set();
      listeners.add(listener);
      handlers.set(event, listeners);
      return map;
    },
    remove: vi.fn(() => handlers.clear()),
  };
  return map;
}

function render() {
  let again = true, passes = 0;
  while (again) {
    if (++passes > 20) throw Error("Unbounded component effect loop");
    hooks.begin();
    const tree = Component(props);
    tree.props.children[0].props.ref.current = container;
    again = hooks.flush();
  }
}

async function settleImport() {
  await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  hooks.reset();
  importGate = deferred();
  importEntered = deferred();
  moduleMap = incompleteMap();
  construct = vi.fn(() => moduleMap);
  status = vi.fn();
  props = { routes: [], mode: "shiokest", onStatusChange: status };
  vi.stubGlobal("window", { location: { search: "" }, matchMedia: () => ({ matches: true }) });

  vi.doMock("maplibre-gl", async () => {
    importEntered.resolve();
    await importGate.promise;
    return {
      Map: class { constructor() { return construct(); } },
      Popup: class {},
      setWorkerUrl: vi.fn(),
      addProtocol: vi.fn(),
    };
  });
  ({ RouteEvidenceMap: Component } = await import("../../components/route-evidence-map"));
});

afterEach(async () => {
  hooks.unmount();
  importGate.resolve();
  await settleImport();
  vi.doUnmock("maplibre-gl");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("map startup with a controlled pending module import", () => {
  it("times out before import resolves and never constructs from the late resolution", async () => {
    render();
    await importEntered.promise;
    expect(status).toHaveBeenLastCalledWith("mounting");
    vi.advanceTimersByTime(29_999);
    expect(status).toHaveBeenCalledTimes(1);
    expect(construct).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(status).toHaveBeenLastCalledWith("error", expect.stringContaining("Reload"), "reload");
    expect(vi.getTimerCount()).toBe(0);

    status.mockClear();
    importGate.resolve();
    await settleImport();
    vi.advanceTimersByTime(60_000);
    expect(construct).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
    expect(moduleMap.handlers.size).toBe(0);
    expect(moduleMap.remove).not.toHaveBeenCalled();
  });

  it("does not report a second error when the import rejects after the deadline", async () => {
    render();
    await importEntered.promise;
    vi.advanceTimersByTime(30_000);
    expect(status.mock.calls.filter(([state]) => state === "error")).toHaveLength(1);

    status.mockClear();
    importGate.reject(new Error("late module failure"));
    await settleImport();
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    expect(construct).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports import rejection once and cancels the outstanding startup deadline", async () => {
    render();
    await importEntered.promise;
    importGate.reject(new Error("module unavailable"));
    await settleImport();
    expect(status.mock.calls.map(([state]) => state)).toEqual(["mounting", "error"]);
    expect(status).toHaveBeenLastCalledWith("error", expect.any(String), "reload");
    expect(construct).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    status.mockClear();
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
  });

  it.each(["fresh remount", "retained-ref effect replay"] as const)("only the current attempt owns the resolved map after %s", async replacement => {
    render();
    await importEntered.promise;
    vi.advanceTimersByTime(10_000);
    if (replacement === "fresh remount") {
      hooks.unmount();
      hooks.reset();
    } else {
      hooks.replayEffects();
    }
    render();
    status.mockClear();

    importGate.resolve();
    await settleImport();
    expect(construct).toHaveBeenCalledTimes(1);
    expect(status.mock.calls.map(([state]) => state)).toEqual(["initializing"]);
    expect(moduleMap.handlers.get("load")?.size).toBe(1);
    expect((window as unknown as { __shiokRouteMap: unknown }).__shiokRouteMap).toBe(moduleMap);
    expect(vi.getTimerCount()).toBe(1);

    // A's old deadline must not expire B, whose deadline is ten seconds later.
    status.mockClear();
    vi.advanceTimersByTime(20_000);
    expect(status).not.toHaveBeenCalled();
    expect(moduleMap.remove).not.toHaveBeenCalled();
    expect((window as unknown as { __shiokRouteMap: unknown }).__shiokRouteMap).toBe(moduleMap);
    hooks.unmount();
    expect(moduleMap.remove).toHaveBeenCalledTimes(1);
    expect(moduleMap.handlers.size).toBe(0);
    expect((window as unknown as { __shiokRouteMap: unknown }).__shiokRouteMap).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
  });
});
