import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Real component handlers/lifecycle with hook and textarea doubles, not native Tab/browser coverage.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0, dirty = false, writes = 0;
  let pending: Array<() => void> = [];
  return {
    begin() { cursor = 0; dirty = false; },
    changed: () => dirty,
    stateWrites: () => writes,
    commit() { const work = pending; pending = []; work.forEach(run => run()); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); slots.length = 0; cursor = 0; pending = []; },
    useId: () => "failure-diagnostics-test",
    useRef<T>(value: T): { current: T } {
      const slot = slots[cursor++] ??= { value: { current: value } };
      return slot.value as { current: T };
    },
    useState<T>(value: T): [T, (next: T) => void] {
      const slot = slots[cursor++] ??= { value };
      return [slot.value as T, next => {
        writes++;
        if (!Object.is(slot.value, next)) { slot.value = next; dirty = true; }
      }];
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

import { FailureDiagnosticsControl, type FailureDiagnosticsControlProps } from "../../components/failure-diagnostics-control";

type Element = ReactElement<{
  children?: ReactNode; ref?: { current: unknown }; onClick?: () => void | Promise<void>;
  disabled?: boolean; readOnly?: boolean; value?: string; id?: string; htmlFor?: string;
  type?: string; autoFocus?: boolean; tabIndex?: number; onKeyDown?: unknown; role?: string;
  spellCheck?: boolean; autoComplete?: string; "aria-describedby"?: string; "aria-modal"?: boolean;
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

let props: FailureDiagnosticsControlProps, tree: ReactNode;
let field: { focus: ReturnType<typeof vi.fn>; select: ReturnType<typeof vi.fn>; isConnected: boolean };
let copyControl: {
  ownerDocument: typeof documentDouble; isConnected: boolean; disabled: boolean; focus: ReturnType<typeof vi.fn>;
};
let selectControl: { isConnected: boolean }, hideControl: { isConnected: boolean };
let documentDouble: { activeElement: unknown; body: object };
let writeText: ReturnType<typeof vi.fn>, network: ReturnType<typeof vi.fn>, storage: ReturnType<typeof vi.fn>, urlWrite: ReturnType<typeof vi.fn>;
const valueA = '{\n  "version": 1, "stage": "component-download"\n}\n';
const valueB = '{"version":1,"stage":"route-render"}';
const copyFailure = "Copy unavailable.";

function render(commit = true) {
  for (let turn = 0; turn < 5; turn++) {
    host.begin(); tree = FailureDiagnosticsControl(props);
    const copy = button("Copy diagnostics");
    if (copy.props.ref) copy.props.ref.current = copyControl;
    copyControl.disabled = copy.props.disabled === true;
    const textarea = elements(tree).find(node => node.type === "textarea");
    if (textarea) textarea.props.ref!.current = field;
    // Model node removal and disabled-button focus timing before layout effects.
    for (const control of [field, selectControl, hideControl]) {
      control.isConnected = Boolean(textarea);
      if (!control.isConnected && documentDouble.activeElement === control) documentDouble.activeElement = documentDouble.body;
    }
    if (!commit) return;
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
function click(name = "Copy diagnostics") {
  const target = button(name);
  expect(target.props.disabled).not.toBe(true);
  return target.props.onClick!();
}
function settle(pending: ReturnType<typeof deferred>, outcome: "resolve" | "reject") {
  if (outcome === "resolve") pending.resolve(); else pending.reject(new Error("Private clipboard failure"));
}
function expectIdle(manualValue?: string) {
  expect(text(tree)).not.toMatch(/Copied\.|Copy unavailable|Copying/);
  expect(button("Copy diagnostics").props.disabled).not.toBe(true);
  const textarea = elements(tree).find(node => node.type === "textarea");
  if (manualValue === undefined) {
    expect(textarea).toBeUndefined();
    expect(elements(tree).some(node => node.type === "button" && node.props["aria-label"] === "Hide diagnostics")).toBe(false);
  }
  else {
    expect(textarea?.props.value).toBe(manualValue);
    expect(button("Select diagnostics").props.disabled).not.toBe(true);
    expect(button("Hide diagnostics").props.disabled).not.toBe(true);
  }
}

beforeEach(() => {
  host.unmount();
  props = { value: valueA, snapshotKey: "internal-owner-a" };
  documentDouble = { activeElement: null, body: {} };
  field = { focus: vi.fn(() => { documentDouble.activeElement = field; }), select: vi.fn(), isConnected: false };
  selectControl = { isConnected: false }; hideControl = { isConnected: false };
  copyControl = {
    ownerDocument: documentDouble, isConnected: true, disabled: false,
    focus: vi.fn(() => {
      if (!copyControl.disabled && copyControl.isConnected) documentDouble.activeElement = copyControl;
    }),
  };
  writeText = vi.fn().mockResolvedValue(undefined);
  network = vi.fn(() => { throw new Error("No diagnostic network access"); });
  storage = vi.fn(() => { throw new Error("No diagnostic storage access"); });
  urlWrite = vi.fn(() => { throw new Error("No diagnostic URL writes"); });
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  vi.stubGlobal("document", documentDouble);
  vi.stubGlobal("fetch", network);
  vi.stubGlobal("localStorage", { getItem: storage, setItem: storage });
  vi.stubGlobal("sessionStorage", { getItem: storage, setItem: storage });
  vi.stubGlobal("history", { pushState: urlWrite, replaceState: urlWrite });
});

afterEach(() => {
  host.unmount();
  expect(network).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled(); expect(urlWrite).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("T03 inline failure diagnostics copy", () => {
  it("uses compact labelled commands and requests extra stack room only while manual diagnostics are open", async () => {
    render();
    expect(tree.props["data-failure-diagnostics-manual"]).toBeUndefined();
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await click(); render();
    expect(tree.props["data-failure-diagnostics-manual"]).toBe(true);
    expect(text(button("Select diagnostics"))).toBe("Select");
    expect(text(button("Hide diagnostics"))).toBe("Hide");
    click("Hide diagnostics"); render();
    expect(tree.props["data-failure-diagnostics-manual"]).toBeUndefined();
  });
  it("does not copy, reveal a manual field or steal focus on mount, rerender or snapshot changes", () => {
    render(); render(); props = { value: valueB, snapshotKey: 2 }; render();
    expectIdle(); expect(writeText).not.toHaveBeenCalled();
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
  });

  it("copies the exact supplied serialization only on explicit activation, never the internal key", async () => {
    render(); await click(); render();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(valueA);
    expect(text(tree)).toContain("Copied.");
    expect(renderToStaticMarkup(tree)).not.toContain("internal-owner-a");
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
  });

  it("disables a pending copy and also blocks duplicate activation before a rerender", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const handler = button("Copy diagnostics").props.onClick!;
    const task = handler(); await handler(); render();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(button("Copy diagnostics").props.disabled).toBe(true);
    expect(text(tree)).toContain("Copying...");
    pending.resolve(); await task; render();
    expect(button("Copy diagnostics").props.disabled).toBe(false);
    expect(text(tree)).toContain("Copied.");
  });

  it.each(["denied", "absent", "throwing-getter", "throwing-write", "no-navigator"])(
    "offers labelled manual selection after %s without leaking the raw error or retrying", async failure => {
      if (failure === "denied") writeText.mockRejectedValueOnce(new Error("Private clipboard failure"));
      if (failure === "absent") vi.stubGlobal("navigator", {});
      if (failure === "throwing-getter") vi.stubGlobal("navigator", Object.defineProperty({}, "clipboard", {
        get() { throw new Error("Private clipboard failure"); },
      }));
      if (failure === "throwing-write") writeText.mockImplementationOnce(() => { throw new Error("Private clipboard failure"); });
      if (failure === "no-navigator") vi.stubGlobal("navigator", undefined);
      render(); await click(); render(); render();
      expect(text(tree)).toContain(copyFailure);
      const textarea = elements(tree).find(node => node.type === "textarea")!;
      expect(textarea.props).toMatchObject({ value: valueA, readOnly: true, spellCheck: false, autoComplete: "off" });
      expect(elements(tree).some(node => node.type === "label" && node.props.htmlFor === textarea.props.id && text(node) === "Diagnostics")).toBe(true);
      expect(elements(tree).some(node => node.props.id === textarea.props["aria-describedby"] && text(node) === copyFailure)).toBe(true);
      expect(renderToStaticMarkup(tree)).not.toMatch(/Private clipboard failure|internal-owner-a/);
      expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
      const attempts = writeText.mock.calls.length;
      click("Select diagnostics");
      expect(field.focus).toHaveBeenCalledTimes(1); expect(field.select).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledTimes(attempts);
    },
  );

  it("keeps manual selection mounted during and after an explicit retry, with no automatic retry", async () => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render(); render();
    expect(writeText).toHaveBeenCalledTimes(1);
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    const task = click(); render();
    expect(button("Copy diagnostics").props.disabled).toBe(true);
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe(valueA);
    click("Select diagnostics");
    pending.resolve(); await task; render();
    expect(text(tree)).toContain("Copied."); expect(writeText).toHaveBeenCalledTimes(2);
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe(valueA);
    expect(button("Select diagnostics").props.disabled).not.toBe(true);
    expect(field.focus).toHaveBeenCalledTimes(1);
  });

  it.each(["resolve", "reject"] as const)("ignores a different value's late %s and copies the new value only on request", async outcome => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click(); render();
    props.value = valueB; render(); expectIdle();
    settle(pending, outcome); await task; render(); expectIdle();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(valueA);
    await click(); render(); expect(writeText).toHaveBeenLastCalledWith(valueB);
    expect(text(tree)).toContain("Copied.");
  });

  it.each(["resolve", "reject"] as const)("invalidates a late %s when only the key changes, including number versus string", async outcome => {
    props.snapshotKey = 1;
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click(); render();
    props.snapshotKey = "1"; render(); expectIdle();
    settle(pending, outcome); await task; render(); expectIdle();
    await click(); render(); expect(writeText).toHaveBeenNthCalledWith(2, valueA);
    expect(text(tree)).toContain("Copied.");
  });

  it.each(["resolve", "reject"] as const)("does not revive an A attempt after an A to B to A owner cycle (%s)", async outcome => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click(); render();
    props.snapshotKey = "internal-owner-b"; render();
    props.snapshotKey = "internal-owner-a"; render();
    settle(pending, outcome); await task; render(); expectIdle();
  });

  it.each(["copied", "failed"] as const)("hides old %s feedback synchronously before the new key's layout effect", async status => {
    if (status === "failed") writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render();
    expect(text(tree)).toContain(status === "copied" ? "Copied." : copyFailure);
    const retainedValue = status === "failed" ? valueA : undefined;
    props.snapshotKey = "internal-owner-b"; render(false); expectIdle(retainedValue);
    host.commit(); render(); expectIdle(retainedValue);
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
  });

  it.each(["textarea", "select-button", "outside"])(
    "retains manual control positions with the new snapshot and no focus action when focus is on %s", async location => {
      writeText.mockRejectedValueOnce(new Error("Denied"));
      render(); await click(); render();
      const oldFieldRef = elements(tree).find(node => node.type === "textarea")!.props.ref;
      const oldPositions = elements(tree).map(node => [node.type, node.key, node.props.id]);
      const focusOwner = location === "textarea" ? field : location === "select-button" ? selectControl : { location };
      documentDouble.activeElement = focusOwner;
      props = { value: valueB, snapshotKey: "internal-owner-b" };

      // The returned element tree must never remove/rekey the manual branch, even before effects.
      render(false); expectIdle(valueB);
      expect(elements(tree).map(node => [node.type, node.key, node.props.id])).toEqual(oldPositions);
      expect(elements(tree).find(node => node.type === "textarea")!.props.ref).toBe(oldFieldRef);
      host.commit(); render(); expectIdle(valueB);
      expect(elements(tree).map(node => [node.type, node.key, node.props.id])).toEqual(oldPositions);
      expect(documentDouble.activeElement).toBe(focusOwner);
      expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
      expect(copyControl.focus).not.toHaveBeenCalled();
      expect(writeText).toHaveBeenCalledExactlyOnceWith(valueA);

      await click(); render();
      expect(writeText.mock.calls).toEqual([[valueA], [valueB]]);
      expect(elements(tree).find(node => node.type === "textarea")?.props).toMatchObject({ value: valueB, readOnly: true });
      expect(text(tree)).toContain("Copied.");
      expect(documentDouble.activeElement).toBe(focusOwner);
      expect(renderToStaticMarkup(tree)).not.toMatch(/internal-owner-a|internal-owner-b|component-download/);
      click("Select diagnostics");
      expect(documentDouble.activeElement).toBe(field);
      expect(field.focus).toHaveBeenCalledTimes(1); expect(field.select).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledTimes(2);
    },
  );

  it.each(["resolve", "reject"] as const)("keeps updated manual text when a replaced snapshot's retry later %s", async outcome => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render();
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    const task = click(); render();
    props = { value: valueB, snapshotKey: "internal-owner-b" }; render(); expectIdle(valueB);
    settle(pending, outcome); await task; render(); expectIdle(valueB);
    expect(writeText.mock.calls).toEqual([[valueA], [valueA]]);
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
  });

  it.each(["textarea", "outside"])("does not restore focus on whole-component unmount from %s", async location => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render();
    documentDouble.activeElement = location === "textarea" ? field : { location };
    host.unmount();
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
    expect(copyControl.focus).not.toHaveBeenCalled();
    render(); expectIdle();
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("collapses manual diagnostics only on explicit Hide, resets feedback and focuses the surviving Copy button", async () => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render();
    documentDouble.activeElement = hideControl;
    click("Hide diagnostics");
    expect(copyControl.focus).not.toHaveBeenCalled();
    render(); expectIdle();
    expect(copyControl.focus).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(copyControl);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(valueA);
    props = { value: valueB, snapshotKey: "internal-owner-b" }; render(); expectIdle();
    expect(writeText).toHaveBeenCalledTimes(1);
    writeText.mockRejectedValueOnce(new Error("Denied again"));
    await click(); render();
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe(valueB);
    expect(text(tree)).toContain(copyFailure);
    expect(copyControl.focus).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls).toEqual([[valueA], [valueB]]);
  });

  it.each(["resolve", "reject"] as const)("Hide invalidates a pending retry's %s without another OS copy", async outcome => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render();
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    const task = click(); render();
    expect(copyControl.disabled).toBe(true);
    documentDouble.activeElement = hideControl;
    click("Hide diagnostics");
    expect(copyControl.focus).not.toHaveBeenCalled();
    render(); expectIdle();
    expect(copyControl.disabled).toBe(false);
    expect(copyControl.focus).toHaveBeenCalledTimes(1);
    expect(documentDouble.activeElement).toBe(copyControl);
    const writes = host.stateWrites();
    settle(pending, outcome); await task; render(); expectIdle();
    expect(host.stateWrites()).toBe(writes);
    expect(writeText.mock.calls).toEqual([[valueA], [valueA]]);
    expect(copyControl.focus).toHaveBeenCalledTimes(1);
  });

  it.each(["outside-focus", "snapshot-change", "unmount"])("does not restore queued Hide focus after a newer %s", async change => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    render(); await click(); render(); documentDouble.activeElement = hideControl;
    click("Hide diagnostics");
    const outside = { isConnected: true };
    if (change === "outside-focus") documentDouble.activeElement = outside;
    if (change === "snapshot-change") props = { value: valueB, snapshotKey: "internal-owner-b" };
    if (change === "unmount") host.unmount(); else { render(); expectIdle(); }
    expect(copyControl.focus).not.toHaveBeenCalled();
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
    if (change === "outside-focus") expect(documentDouble.activeElement).toBe(outside);
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("does not let an old failure override a new owner's success", async () => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const oldTask = click(); render();
    props = { value: valueB, snapshotKey: "internal-owner-b" }; render();
    await click(); render();
    pending.reject(new Error("Old denied")); await oldTask; render();
    expect(text(tree)).toContain("Copied."); expect(text(tree)).not.toContain(copyFailure);
    expect(writeText.mock.calls).toEqual([[valueA], [valueB]]);
  });

  it.each(["resolve", "reject"] as const)("does not update state after unmount and late %s", async outcome => {
    const pending = deferred(); writeText.mockReturnValueOnce(pending.promise);
    render(); const task = click(); render(); host.unmount();
    const before = host.stateWrites(); settle(pending, outcome); await task;
    expect(host.stateWrites()).toBe(before);
    expect(field.focus).not.toHaveBeenCalled(); expect(field.select).not.toHaveBeenCalled();
  });

  it("ignores an old owner's retained click handler after a committed snapshot change", async () => {
    render(); const oldHandler = button("Copy diagnostics").props.onClick!;
    props = { value: valueB, snapshotKey: "internal-owner-b" }; render();
    await oldHandler(); render(); expectIdle(); expect(writeText).not.toHaveBeenCalled();
  });

  it("preserves an empty supplied string and a zero key without inventing snapshot validation", async () => {
    props = { value: "", snapshotKey: 0 }; render(); await click(); render();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(""); expect(text(tree)).toContain("Copied.");
  });

  it("uses ordinary labelled controls with no modal, keyboard trap, autofocus or HTML interpretation", async () => {
    props.value = '{"message":"<script>synthetic</script>&"}';
    writeText.mockRejectedValueOnce(new Error("Denied")); render(); await click(); render();
    for (const node of elements(tree)) {
      expect(node.type).not.toBe("dialog"); expect(node.props.role).not.toBe("dialog");
      expect(node.props["aria-modal"]).not.toBe(true); expect(node.props.autoFocus).not.toBe(true);
      expect(node.props.onKeyDown).toBeUndefined(); expect(node.props.tabIndex).toBeUndefined();
      if (node.type === "button") expect(node.props.type).toBe("button");
    }
    expect(elements(tree).some(node => node.props.role === "status")).toBe(true);
    expect(renderToStaticMarkup(tree)).toContain("&lt;script&gt;synthetic&lt;/script&gt;&amp;");
    expect(renderToStaticMarkup(tree)).not.toContain("<script>");
  });
});
