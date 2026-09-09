import React, { type ComponentProps, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteEvidenceMap } from "../../components/route-evidence-map";

// Only Home executes: child elements remain inspectable, and effects never run.
// This checks page handlers, not React DOM, navigation, MapLibre or worker recovery.
const host = vi.hoisted(() => {
  let index = 0;
  const slots: Array<{ value: unknown; deps?: readonly unknown[] }> = [];
  function memo<T>(make: () => T, deps: readonly unknown[]): T {
    const i = index++;
    const previous = slots[i];
    if (!previous?.deps || previous.deps.length !== deps.length ||
        deps.some((value, j) => !Object.is(value, previous.deps![j]))) {
      slots[i] = { value: make(), deps };
    }
    return slots[i].value as T;
  }
  return {
    begin() { index = 0; },
    reset() { index = 0; slots.length = 0; },
    useState<T>(initial: T | (() => T)): [T, (update: T | ((previous: T) => T)) => void] {
      const i = index++;
      const slot = slots[i] ??= {
        value: typeof initial === "function" ? (initial as () => T)() : initial,
      };
      return [slot.value as T, update => {
        slot.value = typeof update === "function"
          ? (update as (previous: T) => T)(slot.value as T) : update;
      }];
    },
    useRef<T>(initial: T): { current: T } {
      const i = index++;
      slots[i] ??= { value: { current: initial } };
      return slots[i].value as { current: T };
    },
    useMemo: memo,
    useCallback<T>(callback: T, deps: readonly unknown[]): T { return memo(() => callback, deps); },
    useEffect() { index++; },
  };
});

const children = vi.hoisted(() => ({ MapChild: function MapChild() { return null; } }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const hooks = {
    useState: host.useState, useRef: host.useRef, useMemo: host.useMemo,
    useCallback: host.useCallback, useEffect: host.useEffect,
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock("next/dynamic", () => ({ default: () => children.MapChild }));
vi.mock("../../components/route-map-loader", () => ({ RouteMapLoader: children.MapChild, preloadRouteMap: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import Home from "../../app/page";

type Element = ReactElement<{ children?: ReactNode; onClick?: () => void }>;
type MapProps = ComponentProps<typeof RouteEvidenceMap>;
const selectedUrl = "https://example.test/?postal=018956&stop=example-stop#walk";
const point = { lat: 1.28, lng: 103.85 };
let tree: ReactNode;
let reload: ReturnType<typeof vi.fn>;
let confirm: ReturnType<typeof vi.fn>;
let replaceState: ReturnType<typeof vi.fn>;
let fetch: ReturnType<typeof vi.fn>;

function render() {
  host.begin();
  tree = Home();
}

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(child => elements(child));
  if (!React.isValidElement<{ children?: ReactNode }>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function label(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(label).join("");
  if (React.isValidElement<{ children?: ReactNode }>(node)) return label(node.props.children);
  return "";
}

function buttons(text: string) {
  return elements(tree).filter(element => element.type === "button" && label(element.props.children) === text);
}

function click(text: string) {
  const matches = buttons(text);
  expect(matches).toHaveLength(1);
  expect(matches[0].props.onClick).toBeTypeOf("function");
  matches[0].props.onClick!();
}

function mapChild(): ReactElement<MapProps> {
  const matches = elements(tree).filter(element => element.type === children.MapChild);
  expect(matches).toHaveLength(1);
  return matches[0] as ReactElement<MapProps>;
}

function status(...args: Parameters<NonNullable<MapProps["onStatusChange"]>>) {
  mapChild().props.onStatusChange!(...args);
  render();
}

beforeEach(() => {
  host.reset();
  reload = vi.fn();
  confirm = vi.fn(() => false);
  replaceState = vi.fn();
  fetch = vi.fn(() => { throw new Error("Page-action tests must not fetch data"); });
  vi.stubGlobal("window", {
    location: { href: selectedUrl, search: "?postal=018956&stop=example-stop", hash: "#walk", reload },
    history: { replaceState },
    confirm,
  });
  vi.stubGlobal("fetch", fetch);
  render();
});

afterEach(() => {
  try {
    expect(fetch).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
    host.reset();
  }
});

describe("Home map recovery actions", () => {
  it("records the failed map stage and clears it when a later attempt starts", () => {
    status("error", "The map download failed.", "reload", { stage: "component-download", reason: "rejected", elapsedMs: 12 });
    let main = elements(tree).find(element => element.type === "main") as ReactElement<Record<string, unknown>>;
    expect(main.props["data-map-stage"]).toBe("component-download");
    expect(main.props["data-map-failure"]).toBe("rejected");
    expect(buttons("Reload page")).toHaveLength(1);
    expect(reload).not.toHaveBeenCalled();
    status("mounting");
    main = elements(tree).find(element => element.type === "main") as ReactElement<Record<string, unknown>>;
    expect(main.props["data-map-stage"]).toBeUndefined();
    expect(main.props["data-map-failure"]).toBeUndefined();
    expect(buttons("Reload page")).toHaveLength(0);
  });

  it("does not reload on failure or rerender; no-draft explicit Reload page calls reload once", () => {
    const original = mapChild();
    status("error", "The map did not start.", "reload");
    expect(buttons("Reload page")).toHaveLength(1);
    expect(buttons("Retry map")).toHaveLength(0);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    render();
    expect(reload).not.toHaveBeenCalled();

    click("Reload page");
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith();
    expect(confirm).not.toHaveBeenCalled();
    expect(window.location.href).toBe(selectedUrl);
    render();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(mapChild().key).toBe(original.key);
    expect(mapChild().props.retryKey).toBe(original.props.retryKey);
  });

  it.each([false, true])("retained unsent point requires confirmation; accepted=%s", accepted => {
    mapChild().props.onFeedbackPoint!(point);
    render();
    expect(mapChild().props.feedbackPoints).toEqual([point]);
    const original = mapChild();
    status("error", "The map did not start.", "reload");
    confirm.mockReturnValue(accepted);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();

    click("Reload page");
    expect(confirm).toHaveBeenCalledExactlyOnceWith(
      "Reloading will discard your unsent feedback. Reload the page?",
    );
    expect(reload).toHaveBeenCalledTimes(accepted ? 1 : 0);
    render();
    expect(mapChild().props.feedbackPoints).toEqual([point]);
    expect(mapChild().key).toBe(original.key);
    expect(mapChild().props.retryKey).toBe(original.props.retryKey);
  });

  it("ordinary partial failure increments retryKey without remounting or reloading", () => {
    const original = mapChild();
    status("partial", "Some basemap tiles could not load.");
    expect(buttons("Reload page")).toHaveLength(0);
    click("Retry map");
    render();
    expect(mapChild().props.retryKey).toBe((original.props.retryKey ?? 0) + 1);
    expect(mapChild().key).toBe(original.key);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("error after ready remounts the map without changing retryKey or reloading", () => {
    status("ready");
    const original = mapChild();
    status("error", "The map could not render.");
    expect(buttons("Reload page")).toHaveLength(0);
    click("Retry map");
    render();
    expect(mapChild().key).not.toBe(original.key);
    expect(mapChild().props.retryKey).toBe(original.props.retryKey);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("a subsequent partial status clears an earlier reload instruction", () => {
    status("error", "The map did not start.", "reload");
    expect(buttons("Reload page")).toHaveLength(1);
    const original = mapChild();
    status("partial", "Some basemap tiles could not load.");
    expect(buttons("Reload page")).toHaveLength(0);
    click("Retry map");
    render();
    expect(mapChild().props.retryKey).toBe((original.props.retryKey ?? 0) + 1);
    expect(mapChild().key).toBe(original.key);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("ready hides recovery actions and a later ordinary error does not inherit reload", () => {
    status("error", "The map did not start.", "reload");
    status("ready");
    expect(buttons("Reload page")).toHaveLength(0);
    expect(buttons("Retry map")).toHaveLength(0);
    const original = mapChild();
    status("error", "The selected walk is not visible.");
    expect(buttons("Reload page")).toHaveLength(0);
    click("Retry map");
    render();
    expect(mapChild().key).not.toBe(original.key);
    expect(mapChild().props.retryKey).toBe(original.props.retryKey);
    expect(reload).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
