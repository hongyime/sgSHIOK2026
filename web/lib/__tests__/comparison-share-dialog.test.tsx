import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Execute the real lifecycle and handlers with focus/modal doubles. Native focus trapping,
// Escape dispatch and return focus require the parent's real-browser acceptance.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0, dirty = false;
  let pending: Array<() => void> = [];
  return {
    begin() { cursor = 0; dirty = false; },
    changed: () => dirty,
    commit() { const work = pending; pending = []; work.forEach(run => run()); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); slots.length = 0; cursor = 0; pending = []; },
    useId: () => "comparison-share-test",
    useRef<T>(value: T): { current: T } {
      const slot = slots[cursor++] ??= { value: { current: value } };
      return slot.value as { current: T };
    },
    useState<T>(value: T): [T, (next: T) => void] {
      const slot = slots[cursor++] ??= { value };
      return [slot.value as T, next => { if (!Object.is(slot.value, next)) { slot.value = next; dirty = true; } }];
    },
    useLayoutEffect(create: () => void | (() => void), deps: readonly unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!slot.deps || slot.deps.length !== deps.length || deps.some((dep, index) => !Object.is(dep, slot.deps![index]))) {
        slot.deps = deps;
        pending.push(() => { slot.cleanup?.(); slot.cleanup = create() || undefined; });
      }
    },
  };
});

vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const hooks = { useRef: host.useRef, useState: host.useState, useLayoutEffect: host.useLayoutEffect, useId: host.useId };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});

import { ComparisonShareDialog, type ComparisonShareDialogProps } from "../../components/comparison-share-dialog";

type Element = ReactElement<{
  children?: ReactNode; ref?: { current: unknown }; onClick?: () => void | Promise<void>;
  onCancel?: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
  onKeyDown?: (event: {
    key: string; stopPropagation: () => void; preventDefault?: () => void;
    currentTarget?: typeof modal; shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean;
  }) => void;
  disabled?: boolean; readOnly?: boolean; value?: string; id?: string; htmlFor?: string; autoFocus?: boolean;
  "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string;
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
function deferred() {
  let resolve!: () => void, reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

type FocusTarget = {
  isConnected: boolean; disabled: boolean; tabIndex: number; layoutVisible: boolean; visibility: string; hiddenAncestor: boolean;
  matches: (selector: string) => boolean; focus: ReturnType<typeof vi.fn>;
  getClientRects: () => object[]; closest: (selector: string) => object | null;
};
let documentDouble: {
  activeElement: unknown; body: object; documentElement: object;
  defaultView: { getComputedStyle: (target: FocusTarget) => { visibility: string } };
};
let opener: FocusTarget, close: FocusTarget, copy: FocusTarget, select: FocusTarget;
let field: FocusTarget & { select: ReturnType<typeof vi.fn> };
let modal: {
  open: boolean; ownerDocument: typeof documentDouble;
  contains: (target: unknown) => boolean; showModal: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn>;
  querySelectorAll: (selector: string) => FocusTarget[]; focus: ReturnType<typeof vi.fn>;
};
let props: ComparisonShareDialogProps, tree: ReactNode;
let writeText: ReturnType<typeof vi.fn>, network: ReturnType<typeof vi.fn>, storage: ReturnType<typeof vi.fn>, urlWrite: ReturnType<typeof vi.fn>;
const linkA = "https://example.test/?compare=synthetic-a";
const linkB = "https://example.test/?compare=synthetic-b";

function focusTarget(): FocusTarget {
  const target: FocusTarget = {
    isConnected: true, disabled: false, tabIndex: 0, layoutVisible: true, visibility: "visible", hiddenAncestor: false,
    matches: () => target.disabled,
    getClientRects: () => target.layoutVisible ? [{}] : [],
    closest: () => target.hiddenAncestor ? {} : null,
    focus: vi.fn(() => { if (!target.disabled && target.isConnected) documentDouble.activeElement = target; }),
  };
  return target;
}
function render() {
  for (let turn = 0; turn < 5; turn++) {
    host.begin(); tree = ComparisonShareDialog(props);
    elements(tree).find(node => node.type === "dialog")!.props.ref!.current = modal;
    elements(tree).find(node => node.type === "input")!.props.ref!.current = field;
    copy.disabled = button("Copy link").props.disabled === true;
    host.commit();
    if (!host.changed()) return;
  }
  throw new Error("Unexpected lifecycle render loop");
}
function button(name: string): Element {
  const found = elements(tree).find(node => node.type === "button" && (node.props["aria-label"] ?? text(node)) === name);
  expect(found, name).toBeDefined();
  return found!;
}
function click(name: string) {
  const target = button(name);
  expect(target.props.disabled).not.toBe(true);
  return target.props.onClick!();
}

function key(key: string, shiftKey = false, modifiers: { ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean } = {}) {
  const event = { key, shiftKey, ...modifiers, currentTarget: modal, preventDefault: vi.fn(), stopPropagation: vi.fn() };
  elements(tree)[0].props.onKeyDown!(event);
  return event;
}

beforeEach(() => {
  host.unmount();
  documentDouble = { activeElement: null, body: {}, documentElement: {}, defaultView: { getComputedStyle: target => ({ visibility: target.visibility }) } };
  opener = focusTarget(); close = focusTarget(); copy = focusTarget(); select = focusTarget();
  field = Object.assign(focusTarget(), { select: vi.fn() });
  documentDouble.activeElement = opener;
  let nativeReturnTarget: FocusTarget | null = null;
  modal = {
    open: false, ownerDocument: documentDouble,
    contains: target => target === modal || [close, copy, select, field].includes(target as FocusTarget),
    showModal: vi.fn(() => { nativeReturnTarget = documentDouble.activeElement as FocusTarget; modal.open = true; close.focus(); }),
    close: vi.fn(() => { modal.open = false; nativeReturnTarget?.focus?.(); }),
    querySelectorAll: () => elements(tree).filter(node => node.type === "button" || node.type === "input").map(node =>
      node.type === "input" ? field : node.props["aria-label"] === "Close share dialog" ? close : text(node) === "Copy link" ? copy : select),
    focus: vi.fn(() => { documentDouble.activeElement = modal; }),
  };
  writeText = vi.fn().mockResolvedValue(undefined);
  network = vi.fn(() => { throw new Error("No network from share presentation"); });
  storage = vi.fn(() => { throw new Error("No storage from share presentation"); });
  urlWrite = vi.fn(() => { throw new Error("No URL writes from share presentation"); });
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  vi.stubGlobal("fetch", network);
  vi.stubGlobal("localStorage", { getItem: storage, setItem: storage });
  vi.stubGlobal("history", { pushState: urlWrite, replaceState: urlWrite });
  props = { open: true, link: linkA, onClose: vi.fn() };
});

afterEach(() => {
  host.unmount();
  expect(network).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled(); expect(urlWrite).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("T11 comparison share dialog", () => {
  it("opens modally only when requested and does not reopen on ordinary renders or link changes", () => {
    props.open = false; render();
    expect(modal.showModal).not.toHaveBeenCalled();
    props.open = true; render(); render();
    props.link = linkB; render();
    expect(modal.showModal).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("discloses postals before the copy action and always provides a labelled readonly link", () => {
    render();
    const html = renderToStaticMarkup(tree);
    const disclosure = "This link includes the selected postal codes.";
    expect(html.indexOf(disclosure)).toBeLessThan(html.indexOf(">Copy link<"));
    const input = elements(tree).find(node => node.type === "input")!;
    expect(input.props).toMatchObject({ value: linkA, readOnly: true });
    expect(elements(tree).some(node => node.type === "label" && node.props.htmlFor === input.props.id && text(node) === "Comparison link")).toBe(true);
    const root = elements(tree)[0];
    expect(elements(tree).some(node => node.props.id === root.props["aria-describedby"] && text(node) === disclosure)).toBe(true);
    expect(elements(tree).some(node => node.props.id === root.props["aria-labelledby"] && text(node) === "Share comparison")).toBe(true);
    expect(button("Close share dialog").props.autoFocus).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies exactly the supplied link only after explicit activation", async () => {
    render();
    expect(writeText).not.toHaveBeenCalled();
    await click("Copy link"); render();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(linkA);
    expect(text(tree)).toContain("Copied.");
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("keeps the link selectable while copying and disables the pending command", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link"); render();
    expect(text(tree)).toContain("Copying...");
    expect(button("Copy link").props.disabled).toBe(true);
    expect(elements(tree).find(node => node.type === "input")?.props.value).toBe(linkA);
    pending.resolve(); await task; render();
    expect(button("Copy link").props.disabled).toBe(false);
  });

  it.each(["denied", "absent", "throwing-getter"])("offers manual selection after %s clipboard access without another copy attempt", async failure => {
    if (failure === "denied") writeText.mockRejectedValueOnce(new Error("Denied"));
    if (failure === "absent") vi.stubGlobal("navigator", {});
    if (failure === "throwing-getter") vi.stubGlobal("navigator", Object.defineProperty({}, "clipboard", { get() { throw new Error("Denied"); } }));
    render(); await click("Copy link"); render();
    expect(text(tree)).toContain("Copy failed. Select the link to copy it.");
    expect(elements(tree).find(node => node.type === "input")?.props.value).toBe(linkA);
    const calls = writeText.mock.calls.length;
    click("Select link");
    expect(field.focus).toHaveBeenCalledTimes(1); expect(field.select).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledTimes(calls);
  });

  it("allows an explicit retry after denial without automatically retrying", async () => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click("Copy link"); render(); render();
    expect(writeText).toHaveBeenCalledTimes(1);
    await click("Copy link"); render();
    expect(writeText).toHaveBeenCalledTimes(2); expect(text(tree)).toContain("Copied.");
  });

  it("null link has an empty selectable field, an unavailable message and disabled copy", () => {
    props.link = null; render();
    expect(text(tree)).toContain("Share link unavailable.");
    expect(button("Copy link").props.disabled).toBe(true);
    expect(elements(tree).find(node => node.type === "input")?.props).toMatchObject({ value: "", readOnly: true });
    expect(writeText).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)("ignores an old link's late %s without hiding the new link", async outcome => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link"); render();
    props.link = linkB; render();
    if (outcome === "resolve") pending.resolve(); else pending.reject(new Error("Old denied"));
    await task; render();
    expect(text(tree)).not.toMatch(/Copied\.|Copy failed/);
    expect(elements(tree).find(node => node.type === "input")?.props.value).toBe(linkB);
    await click("Copy link"); render();
    expect(writeText).toHaveBeenLastCalledWith(linkB); expect(text(tree)).toContain("Copied.");
  });

  it.each(["resolve", "reject"] as const)("close/reopen invalidates a pending %s even for the identical link", async outcome => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link"); render();
    click("Close share dialog"); props.open = false; render();
    props.open = true; render();
    if (outcome === "resolve") pending.resolve(); else pending.reject(new Error("Old denied"));
    await task; render();
    expect(text(tree)).not.toMatch(/Copied\.|Copy failed/);
    expect(modal.showModal).toHaveBeenCalledTimes(2);
  });

  it("a close request invalidates feedback before the parent commits closed state", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link"); render();
    click("Close share dialog"); pending.resolve(); await task; render();
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(text(tree)).not.toContain("Copied.");
  });

  it("link changes clear previous success and failure feedback", async () => {
    render(); await click("Copy link"); render();
    expect(text(tree)).toContain("Copied.");
    props.link = linkB; render();
    expect(text(tree)).not.toContain("Copied.");
    writeText.mockRejectedValueOnce(new Error("Denied"));
    await click("Copy link"); render();
    expect(text(tree)).toContain("Copy failed.");
    props.link = null; render();
    expect(text(tree)).not.toContain("Copy failed.");
  });

  it("Escape is contained and cancel requests only the share dialog's close", () => {
    render();
    const root = elements(tree)[0];
    const event = { key: "Escape", stopPropagation: vi.fn(), preventDefault: vi.fn() };
    root.props.onKeyDown!(event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
    root.props.onCancel!(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps forward Tab from the last Copy control to Close", () => {
    render(); documentDouble.activeElement = copy;
    const event = key("Tab");
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(close);
    expect(writeText).not.toHaveBeenCalled(); expect(props.onClose).not.toHaveBeenCalled();
  });

  it("wraps reverse Tab from Close to the last Copy control", () => {
    render(); documentDouble.activeElement = close;
    const event = key("Tab", true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(copy);
  });

  it("leaves interior Tab traversal, including the readonly input, to the browser", () => {
    render();
    for (const [target, backwards] of [[close, false], [field, false], [field, true], [copy, true]] as const) {
      documentDouble.activeElement = target;
      const event = key("Tab", backwards);
      expect(event.preventDefault).not.toHaveBeenCalled(); expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(documentDouble.activeElement).toBe(target);
    }
  });

  it("wraps via the selectable input while Copy is disabled for a pending operation", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link"); render();
    documentDouble.activeElement = field;
    expect(key("Tab").preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(close);
    expect(key("Tab", true).preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(field);
    pending.resolve(); await task;
  });

  it("includes the newly visible manual Select link control at both wrap boundaries", async () => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click("Copy link"); render();
    documentDouble.activeElement = close;
    key("Tab", true); expect(documentDouble.activeElement).toBe(select);
    key("Tab"); expect(documentDouble.activeElement).toBe(close);
    expect(field.select).not.toHaveBeenCalled();
  });

  it.each(["disabled", "hidden-ancestor", "no-layout", "hidden", "collapse", "negative-tabindex"])("excludes a %s final control", mode => {
    render();
    if (mode === "disabled") copy.disabled = true;
    if (mode === "hidden-ancestor") copy.hiddenAncestor = true;
    if (mode === "no-layout") copy.layoutVisible = false;
    if (mode === "hidden" || mode === "collapse") copy.visibility = mode;
    if (mode === "negative-tabindex") copy.tabIndex = -1;
    documentDouble.activeElement = close;
    expect(key("Tab", true).preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(field);
    key("Tab"); expect(documentDouble.activeElement).toBe(close);
  });

  it.each(["ctrlKey", "altKey", "metaKey"])("does not intercept browser-level %s Tab shortcuts", modifier => {
    render(); documentDouble.activeElement = copy;
    const event = key("Tab", false, { [modifier]: true });
    expect(event.preventDefault).not.toHaveBeenCalled(); expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(documentDouble.activeElement).toBe(copy);
  });

  it("does not intercept other keys or Tab after a close request", () => {
    render(); documentDouble.activeElement = copy;
    for (const name of ["Enter", "ArrowLeft", "a"]) {
      const event = key(name);
      expect(event.preventDefault).not.toHaveBeenCalled(); expect(event.stopPropagation).not.toHaveBeenCalled();
    }
    click("Close share dialog");
    expect(key("Tab").preventDefault).not.toHaveBeenCalled();
    props.open = false; render();
    expect(key("Tab").preventDefault).not.toHaveBeenCalled();
  });

  it("wraps both directions to the sole available input", () => {
    render(); close.disabled = true; copy.disabled = true;
    documentDouble.activeElement = field;
    expect(key("Tab").preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(field);
    expect(key("Tab", true).preventDefault).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(field);
  });

  it("keeps focus on the dialog if all descendant controls become unavailable", () => {
    render(); close.disabled = true; copy.disabled = true; field.layoutVisible = false;
    documentDouble.activeElement = modal;
    expect(key("Tab").preventDefault).toHaveBeenCalledTimes(1);
    expect(modal.focus).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the invoking control after the parent closes", () => {
    render(); expect(documentDouble.activeElement).toBe(close);
    click("Close share dialog"); props.open = false; render();
    expect(modal.close).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(opener);
  });

  it("preserves deliberately moved outside focus even when native close restores the opener", () => {
    render();
    const outside = focusTarget(); documentDouble.activeElement = outside;
    props.open = false; render();
    expect(documentDouble.activeElement).toBe(outside);
    expect(outside.focus).toHaveBeenCalledTimes(1);
  });

  it("does not focus a disconnected opener", () => {
    render(); opener.isConnected = false;
    props.open = false; render();
    expect(documentDouble.activeElement).not.toBe(opener);
  });

  it("unmount closes the owned native modal and invalidates pending clipboard completion", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click("Copy link");
    host.unmount(); pending.resolve(); await task;
    expect(modal.open).toBe(false); expect(modal.close).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(opener);
  });
});
