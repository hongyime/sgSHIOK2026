import { Component, type ComponentProps, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteEvidenceMap, RouteMapIssue } from "../../components/route-evidence-map";

type Props = ComponentProps<typeof RouteEvidenceMap>;
type LoaderModule = typeof import("../../components/route-map-loader");
type Loader = InstanceType<LoaderModule["RouteMapLoader"]>;

const imports = vi.hoisted(() => ({
  component: vi.fn(),
  library: vi.fn(),
  dynamic: vi.fn(),
  loader: null as null | (() => Promise<unknown>),
}));
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>, options: unknown) => {
    imports.loader = loader;
    imports.dynamic(loader, options);
    return function DynamicMapDouble() { return null; };
  },
}));

// Execute the real class lifecycle, import promise and child callback. The updater
// and Next renderer are doubles: these tests do not claim DOM error-boundary delivery.
let module: LoaderModule;
let instances: Loader[];
let mapComponent: ReturnType<typeof vi.fn>;
let reload: ReturnType<typeof vi.fn>;
let fetchSpy: ReturnType<typeof vi.fn>;
const timeoutMessage = "The map download did not finish. Your walk details are still available. Reload the page to try again.";
const rejectionMessage = "The map download failed. Your walk details are still available. Reload the page to try again.";
const renderMessage = "The map could not be displayed. Your walk details are still available. Reload the page to try again.";

function create(update: Partial<Props> = {}, mounted = true) {
  const props: Props = { routes: [], mode: "shiokest", onStatusChange: vi.fn(), ...update };
  const instance = new module.RouteMapLoader(props);
  vi.spyOn(instance, "setState").mockImplementation(update => {
    const patch = typeof update === "function" ? update(instance.state, instance.props) : update;
    if (patch) instance.state = { ...instance.state, ...patch };
  });
  instances.push(instance);
  if (mounted) instance.componentDidMount();
  return instance;
}

function childProps(instance: Loader): Props {
  const element = instance.render() as ReactElement<Props> | null;
  if (!element) throw Error("No live map child");
  return element.props;
}

function rerender(instance: Loader, update: Partial<Props>) {
  Object.defineProperty(instance, "props", { value: { ...instance.props, ...update }, configurable: true });
  return instance.render();
}

function boundaryError(instance: Loader, error: unknown) {
  instance.state = { ...instance.state, ...module.RouteMapLoader.getDerivedStateFromError() };
  instance.componentDidCatch(error);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-09T00:00:00Z"));
  instances = [];
  mapComponent = vi.fn(() => null);
  imports.component.mockImplementation(() => ({ RouteEvidenceMap: mapComponent }));
  imports.library.mockImplementation(() => ({ Map: vi.fn() }));
  vi.doMock("../../components/route-evidence-map", () => imports.component());
  vi.doMock("maplibre-gl", () => imports.library());
  imports.loader = null;
  reload = vi.fn();
  fetchSpy = vi.fn(() => { throw Error("Unexpected network access"); });
  vi.stubGlobal("window", { location: { reload } });
  vi.stubGlobal("fetch", fetchSpy);
  module = await import("../../components/route-map-loader");
});

afterEach(() => {
  instances.forEach(instance => instance.componentWillUnmount());
  expect(reload).not.toHaveBeenCalled();
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("T01: native dynamic map download owner", () => {
  it("uses a real React boundary and one module-level non-SSR named-export loader", async () => {
    const first = create();
    const second = create();
    expect(first).toBeInstanceOf(Component);
    expect(imports.dynamic).toHaveBeenCalledExactlyOnceWith(expect.any(Function), { ssr: false });
    expect(imports.component).not.toHaveBeenCalled();
    expect(imports.library).not.toHaveBeenCalled();
    expect(first.render()!.type).toBe(second.render()!.type);
    expect(await imports.loader!()).toBe(mapComponent);
  });

  it("bounds a child that never begins mounting at exactly 30 seconds", () => {
    const instance = create();
    vi.advanceTimersByTime(29_999);
    expect(instance.props.onStatusChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("error", timeoutMessage, "reload", {
      stage: "component-download", reason: "timeout", elapsedMs: 30_000,
    });
    expect(instance.render()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses latest props/callback without restarting the selection-independent deadline", () => {
    const instance = create();
    const previous = instance.props.onStatusChange;
    const latest = vi.fn();
    vi.advanceTimersByTime(20_000);
    rerender(instance, { mode: "shortest", retryKey: 9, chosenStopId: "bus:03509", onStatusChange: latest });
    expect(childProps(instance)).toMatchObject({ mode: "shortest", retryKey: 9, chosenStopId: "bus:03509" });
    vi.advanceTimersByTime(10_000);
    expect(previous).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith("error", timeoutMessage, "reload", {
      stage: "component-download", reason: "timeout", elapsedMs: 30_000,
    });
  });

  it.each([3_600_000, -3_600_000])("measures elapsed time monotonically after a wall-clock adjustment of %s ms", adjustment => {
    const instance = create();
    const monotonicStart = performance.now();
    const wallStart = Date.now();
    vi.advanceTimersByTime(15_000);
    vi.setSystemTime(Date.now() + adjustment);
    expect(Date.now() - wallStart).toBe(15_000 + adjustment);
    expect(performance.now() - monotonicStart).toBe(15_000);
    vi.advanceTimersByTime(14_999);
    expect(instance.props.onStatusChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(performance.now() - monotonicStart).toBe(30_000);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("error", timeoutMessage, "reload", {
      stage: "component-download", reason: "timeout", elapsedMs: 30_000,
    });
    expect(instance.render()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["idle", "mounting", "initializing", "ready", "partial", "error"] as const)(
    "hands the deadline to the child on its first %s status", status => {
      const instance = create();
      vi.advanceTimersByTime(29_999);
      childProps(instance).onStatusChange!(status);
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(90_000);
      expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith(status);
      expect(instance.render()).not.toBeNull();
    },
  );

  it("forwards inner diagnostic arguments unchanged rather than relabeling library/worker work", () => {
    const instance = create();
    const issue: RouteMapIssue = { stage: "library-download", reason: "rejected", elapsedMs: 1_234 };
    childProps(instance).onStatusChange!("error", "Inner fixed message", "reload", issue);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("error", "Inner fixed message", "reload", issue);
    expect(instance.render()).not.toBeNull();
  });

  it("keeps a stable child callback forwarding only to the latest parent callback", () => {
    const instance = create();
    const initial = instance.props.onStatusChange;
    const callback = childProps(instance).onStatusChange!;
    const latest = vi.fn();
    rerender(instance, { onStatusChange: latest, mode: "both" });
    expect(childProps(instance).onStatusChange).toBe(callback);
    callback("mounting");
    callback("ready");
    expect(initial).not.toHaveBeenCalled();
    expect(latest.mock.calls).toEqual([["mounting"], ["ready"]]);
  });

  it("accepts a first child status before the parent did-mount lifecycle", () => {
    const instance = create({}, false);
    childProps(instance).onStatusChange!("mounting");
    instance.componentDidMount();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(30_000);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("mounting");
  });

  it("clears unmounted deadlines and ignores captured late child statuses and errors", () => {
    const instance = create();
    const callback = childProps(instance).onStatusChange!;
    instance.componentWillUnmount();
    callback("ready");
    instance.componentDidCatch(new Error("late"));
    vi.advanceTimersByTime(60_000);
    expect(instance.props.onStatusChange).not.toHaveBeenCalled();
    expect(instance.setState).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not let late child success or changed retry props resurrect a timed-out wrapper", () => {
    const instance = create();
    const callback = childProps(instance).onStatusChange!;
    vi.advanceTimersByTime(30_000);
    callback("mounting");
    callback("ready");
    rerender(instance, { retryKey: 1, routes: [], mode: "shortest" });
    instance.componentDidCatch(new Error("late render error"));
    vi.advanceTimersByTime(30_000);
    expect(instance.props.onStatusChange).toHaveBeenCalledTimes(1);
    expect(instance.render()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not restart the outer deadline for selection changes after the child starts", () => {
    const instance = create();
    childProps(instance).onStatusChange!("mounting");
    rerender(instance, { retryKey: 4, chosenStopId: "different", mode: "both" });
    vi.advanceTimersByTime(120_000);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("mounting");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not mutate frozen map props and forwards optional interaction props", () => {
    const points = Object.freeze([{ lat: 1.3, lng: 103.8 }]);
    const onFeedbackPoint = vi.fn();
    const onSelectTransitStop = vi.fn();
    const instance = create({ feedbackPoints: points as unknown as Props["feedbackPoints"], feedbackEnabled: true,
      onFeedbackPoint, onSelectTransitStop, showLampOverlay: true, mappedExposureContextKey: "context", focusedExposureGap: null });
    Object.freeze(instance.props.routes);
    Object.freeze(instance.props);
    const props = childProps(instance);
    expect(props.feedbackPoints).toBe(points);
    expect(props.onFeedbackPoint).toBe(onFeedbackPoint);
    expect(props.onSelectTransitStop).toBe(onSelectTransitStop);
    expect(props).toMatchObject({ feedbackEnabled: true, showLampOverlay: true, mappedExposureContextKey: "context", focusedExposureGap: null });
    vi.advanceTimersByTime(30_000);
    expect(points).toEqual([{ lat: 1.3, lng: 103.8 }]);
  });

  it("survives lifecycle teardown/replay with one live deadline", () => {
    const instance = create();
    instance.componentWillUnmount();
    expect(vi.getTimerCount()).toBe(0);
    instance.componentDidMount();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(30_000);
    expect(instance.props.onStatusChange).toHaveBeenCalledTimes(1);
  });

  it("supports an absent status callback without throwing on timeout", () => {
    const instance = create({ onStatusChange: undefined });
    expect(() => vi.advanceTimersByTime(30_000)).not.toThrow();
    expect(instance.render()).toBeNull();
  });
});

describe("T01: import rejection, render error and optional preload hints", () => {
  it("brands rejected component imports and reports a sanitized download failure", async () => {
    imports.component.mockImplementation(() => { throw Error("private chunk URL/token must not escape"); });
    const instance = create();
    vi.advanceTimersByTime(400);
    const error = await imports.loader!().catch(error => error);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Map component import rejected");
    boundaryError(instance, error);
    expect(instance.props.onStatusChange).toHaveBeenCalledExactlyOnceWith("error", rejectionMessage, "reload", {
      stage: "component-download", reason: "rejected", elapsedMs: 400,
    });
    expect(instance.render()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.stringify(vi.mocked(instance.props.onStatusChange!).mock.calls)).not.toContain("private");
  });

  it.each([false, true])("labels ordinary child render failures as route-render after child began=%s", began => {
    const instance = create();
    if (began) childProps(instance).onStatusChange!("ready");
    boundaryError(instance, new Error("Loading chunk failed: misleading render error text"));
    expect(instance.props.onStatusChange).toHaveBeenLastCalledWith("error", renderMessage, "reload", {
      stage: "route-render", reason: "error",
    });
    expect(instance.render()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not use error names/messages to impersonate a branded import failure", () => {
    const instance = create();
    const error = new Error("Map component import rejected");
    error.name = "MapComponentImportError";
    boundaryError(instance, error);
    expect(instance.props.onStatusChange).toHaveBeenLastCalledWith("error", renderMessage, "reload", {
      stage: "route-render", reason: "error",
    });
  });

  it("ignores a resolved import after timeout and leaves the rendered child removed", async () => {
    const pending = deferred<{ RouteEvidenceMap: typeof mapComponent }>();
    imports.component.mockImplementation(() => pending.promise);
    const instance = create();
    const download = imports.loader!();
    vi.advanceTimersByTime(30_000);
    pending.resolve({ RouteEvidenceMap: mapComponent });
    expect(await download).toBe(mapComponent);
    expect(instance.render()).toBeNull();
    expect(instance.props.onStatusChange).toHaveBeenCalledTimes(1);
  });

  it.each([[false, false], [true, false], [false, true], [true, true]])(
    "handles both hints safely with component rejected=%s and library rejected=%s", async (componentRejected, libraryRejected) => {
      if (componentRejected) imports.component.mockImplementation(() => { throw Error("component hint rejected"); });
      if (libraryRejected) imports.library.mockImplementation(() => { throw Error("library hint rejected"); });
      await expect(module.preloadRouteMap()).resolves.toBeUndefined();
      expect(imports.component).toHaveBeenCalledTimes(1);
      expect(imports.library).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("does not turn preload completion into map readiness", async () => {
    const instance = create();
    await module.preloadRouteMap();
    expect(instance.props.onStatusChange).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(30_000);
    expect(instance.props.onStatusChange).toHaveBeenLastCalledWith("error", timeoutMessage, "reload", {
      stage: "component-download", reason: "timeout", elapsedMs: 30_000,
    });
  });

  it("handles fire-and-forget hint rejections without automatic retry or readiness", async () => {
    imports.component.mockImplementation(() => { throw Error("component hint rejected"); });
    imports.library.mockImplementation(() => { throw Error("library hint rejected"); });
    void module.preloadRouteMap();
    await vi.dynamicImportSettled();
    vi.advanceTimersByTime(90_000);
    expect(imports.component).toHaveBeenCalledTimes(1);
    expect(imports.library).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
