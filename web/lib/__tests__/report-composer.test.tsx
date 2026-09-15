import React, { type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Match the repo's dependency-free component harness: execute real handlers/lifecycle
// and the real report transport against synthetic fetch responses, not a live endpoint.
// Native DOM focus, browser event dispatch and rendered layout remain integration checks.
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
    useId: () => "report-composer-test",
    useRef<T>(value: T): { current: T } {
      const slot = slots[cursor++] ??= { value: { current: value } };
      return slot.value as { current: T };
    },
    useState<T>(initial: T | (() => T)): [T, (next: T | ((value: T) => T)) => void] {
      const index = cursor++;
      const slot = slots[index] ??= { value: typeof initial === "function" ? (initial as () => T)() : initial };
      return [slot.value as T, next => {
        const value = typeof next === "function" ? (next as (value: T) => T)(slot.value as T) : next;
        if (!Object.is(slot.value, value)) { slot.value = value; dirty = true; }
      }];
    },
    useLayoutEffect(create: () => void | (() => void), deps: readonly unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!slot.deps || slot.deps.length !== deps.length || deps.some((dep, i) => !Object.is(dep, slot.deps![i]))) {
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

import { ReportComposer, type ReportComposerProps } from "../../components/report-composer";
import * as transport from "../report-submission";
import type { ReportGeometry } from "../reports";

type Element = ReactElement<{
  children?: ReactNode; ref?: { current: unknown }; onClick?: () => void | Promise<void>;
  onSubmit?: (event: { preventDefault: () => void }) => void;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  disabled?: boolean; value?: string; checked?: boolean; id?: string; htmlFor?: string;
  type?: string; maxLength?: number; tabIndex?: number; role?: string;
  "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string; "aria-invalid"?: boolean;
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
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const receipt = { receipt_id: "22345678-1234-4123-8123-123456789abc", received_at: "2026-09-15T09:00:00.123456+00:00" };
const success = (replayed = false) => Response.json({ ok: true, receipt, replayed }, { status: replayed ? 200 : 201 });
const failure = (error: string, status: number) => Response.json({ ok: false, error }, { status });
const point: ReportGeometry = { type: "Point", coordinates: [103.85, 1.35] };
let props: ReportComposerProps, tree: ReactNode;
let network: ReturnType<typeof vi.fn>, storage: ReturnType<typeof vi.fn>, urlWrite: ReturnType<typeof vi.fn>;
let focus: ReturnType<typeof vi.fn>;
let prepare: ReturnType<typeof vi.spyOn>, submit: ReturnType<typeof vi.spyOn>;
let logs: ReturnType<typeof vi.spyOn>[];

function render() {
  for (let iteration = 0; iteration < 10; iteration++) {
    host.begin(); tree = ReportComposer(props);
    const heading = elements(tree).find(node => node.type === "h2");
    if (heading?.props.ref) heading.props.ref.current = { focus };
    host.commit();
    if (!host.changed()) return;
  }
  throw new Error("Unexpected composer render loop");
}
function button(name: string): Element {
  const found = elements(tree).find(node => node.type === "button" && (node.props["aria-label"] ?? text(node)) === name);
  expect(found, name).toBeDefined();
  return found!;
}
function click(name: string) {
  const target = button(name);
  expect(target.props.disabled).not.toBe(true);
  const result = target.props.onClick!();
  render();
  return result;
}
function choose(type = "mapping_error") {
  elements(tree).find(node => node.type === "input" && node.props.value === type)!.props.onChange!({ currentTarget: { value: type } });
  render();
}
function note(value: string) {
  elements(tree).find(node => node.type === "textarea")!.props.onChange!({ currentTarget: { value } });
  render();
}
function review() {
  const event = { preventDefault: vi.fn() };
  elements(tree).find(node => node.type === "form")!.props.onSubmit!(event);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  render();
}
function ready(value = "Synthetic shelter note") {
  render(); choose(); note(value); review();
  expect(text(tree)).toContain("Review report");
}
async function send() { await click("Send report"); render(); }
async function uncertain() {
  network.mockRejectedValueOnce(new Error("synthetic offline"));
  ready(); await send();
  expect(text(tree)).toContain("Save not confirmed");
}

beforeEach(() => {
  host.unmount();
  props = {
    geometry: structuredClone(point), context: { postal_code: "001001", destination_id: "synthetic-bus-a", transit_category: "bus", published_route_id: "synthetic-route-a" },
    bundleVersion: "synthetic-bundle-v1", enabled: true, onClose: vi.fn(), onUnsavedChange: vi.fn(),
  };
  focus = vi.fn();
  network = vi.fn(() => Promise.reject(new Error("Unexpected synthetic request")));
  storage = vi.fn(() => { throw new Error("Report storage forbidden"); });
  urlWrite = vi.fn(() => { throw new Error("Report URL writes forbidden"); });
  vi.stubGlobal("fetch", network);
  vi.stubGlobal("localStorage", { getItem: storage, setItem: storage, removeItem: storage });
  vi.stubGlobal("sessionStorage", { getItem: storage, setItem: storage, removeItem: storage });
  vi.stubGlobal("history", { pushState: urlWrite, replaceState: urlWrite });
  let seed = 0;
  vi.stubGlobal("crypto", { getRandomValues: vi.fn((bytes: Uint8Array) => { bytes.fill(++seed); return bytes; }) });
  prepare = vi.spyOn(transport, "prepareReportSubmission");
  submit = vi.spyOn(transport, "submitReport");
  logs = ["log", "info", "warn", "error", "debug"].map(name => vi.spyOn(console, name as "log").mockImplementation(() => {}));
});

afterEach(() => {
  host.unmount();
  expect(storage).not.toHaveBeenCalled(); expect(urlWrite).not.toHaveBeenCalled();
  logs.forEach(log => expect(log).not.toHaveBeenCalled());
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("T16 resident ReportComposer", () => {
  it("defaults to disabled with a visible unavailable explanation and disabled send", () => {
    delete props.enabled;
    ready();
    expect(button("Send report").props.disabled).toBe(true);
    expect(text(tree)).toContain("Sending is unavailable. Reporting is not enabled.");
    expect(network).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
    button("Send report").props.onClick!();
    expect(submit).not.toHaveBeenCalled();
  });

  it("starts with no report type or note and never prepopulates private content", () => {
    delete props.context;
    render();
    expect(elements(tree).filter(node => node.type === "input").every(node => node.props.checked === false)).toBe(true);
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe("");
    expect(text(tree)).not.toContain("Postal ");
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
    expect(prepare).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });

  it("requires a type and prevents native form submission before preparing anything", () => {
    render(); review();
    expect(text(tree)).toContain("Choose a report type.");
    expect(text(tree)).toContain("Draft report");
    expect(prepare).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });

  it.each(["mapping_error", "shelter_request"])("reviews %s with an optional absent note before an explicit POST", async type => {
    delete props.context;
    render(); choose(type); review();
    expect(network).not.toHaveBeenCalled(); expect(prepare).toHaveBeenCalledTimes(1);
    expect(text(tree)).toContain("No note added.");
    network.mockResolvedValueOnce(success());
    await send();
    const body = JSON.parse(network.mock.calls[0][1].body);
    expect(body.report_type).toBe(type); expect(body).not.toHaveProperty("note");
    expect(body).not.toHaveProperty("context");
    expect(body.geometry).toEqual(point);
  });

  it("displays the 30-day private policy and never promises construction or agency delivery", () => {
    render();
    const content = text(tree);
    expect(content).toContain("Private to SHIOK. Reports expire after 30 days.");
    expect(content).toContain("No account needed. Do not include names, contact details or photos.");
    expect(content).not.toMatch(/kept for 30 days|90 days|agency|guaranteed|government/);
  });

  it.each([
    ["point with postal", false, true], ["point without postal", false, false],
    ["section with postal", true, true], ["section without postal", true, false],
  ] as const)("leads with the %s and keeps coordinates inside collapsed location details", (_name, segment, postal) => {
    if (segment) props.geometry = { type: "LineString", coordinates: [[103.85, 1.35], [103.851, 1.351], [103.852, 1.352]] };
    if (!postal) delete props.context;
    render();
    for (const phase of ["draft", "review"]) {
      if (phase === "review") { choose(); review(); }
      const details = elements(tree).find(node => node.type === "details")!;
      const detailsNodes = elements(details);
      const primaryParagraphs = elements(tree).filter(node => node.type === "p" && !detailsNodes.includes(node));
      expect(elements(tree).some(node => node.type === "strong" && text(node) === (segment ? "Selected section" : "Selected point"))).toBe(true);
      expect(text(primaryParagraphs).includes("Postal 001001")).toBe(postal);
      expect(text(primaryParagraphs)).not.toContain("1.35, 103.85");
      expect(text(primaryParagraphs)).not.toContain("1.352, 103.852");
      expect(text(details)).toContain("1.35, 103.85");
      if (segment) {
        expect(text(details)).toContain("1.351, 103.851");
        expect(text(details)).toContain("1.352, 103.852");
      }
      expect(renderToStaticMarkup(details)).toMatch(/^<details><summary>Location details<\/summary>/);
    }
    expect(network).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", null],
    ["outside bounds", { type: "Point", coordinates: [0, 0] }],
    ["nonfinite", { type: "Point", coordinates: [103.85, NaN] }],
    ["oversized point", { type: "Point", coordinates: [103.85, 1.35, 10] }],
    ["one vertex", { type: "LineString", coordinates: [[103.85, 1.35]] }],
    ["zero length", { type: "LineString", coordinates: [[103.85, 1.35], [103.85, 1.35]] }],
    ["33 vertices", { type: "LineString", coordinates: Array.from({ length: 33 }, (_, i) => [103.85 + i * 0.000001, 1.35]) }],
    ["over 1.2 km", { type: "LineString", coordinates: [[103.85, 1.35], [103.87, 1.35]] }],
    ["cumulative over 1.2 km", { type: "LineString", coordinates: [[103.85, 1.35], [103.857, 1.35], [103.85, 1.35]] }],
  ])("rejects %s selection without identity generation or submission", (_name, geometry) => {
    props.geometry = geometry as ReportGeometry | null;
    render(); choose(); review();
    expect(text(tree)).toContain("Choose a valid point or a section up to 1.2 km with at most 32 points.");
    expect(button("Review report").props.disabled).toBe(true);
    expect(prepare).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });

  it.each(["bundle", "context"])("rejects invalid %s without replacing it with a default", field => {
    if (field === "bundle") props.bundleVersion = "";
    else props.context = { postal_code: "private-home" };
    render(); choose(); review();
    expect(button("Review report").props.disabled).toBe(true);
    expect(text(tree)).toContain("map version is unavailable");
    expect(network).not.toHaveBeenCalled();
  });

  it("keeps full segment geometry and all context in the review's location details", () => {
    props.geometry = { type: "LineString", coordinates: [[103.85, 1.35], [103.851, 1.351], [103.852, 1.352]] };
    ready();
    expect(text(tree)).toContain("Selected section");
    for (const value of ["1.35, 103.85", "1.351, 103.851", "1.352, 103.852", "synthetic-bundle-v1", "synthetic-route-a", "synthetic-bus-a", "Bus stop"]) {
      expect(text(tree)).toContain(value);
    }
    const envelope = prepare.mock.results[0].value.envelope;
    expect(envelope.report.geometry).toEqual(props.geometry);
    expect(envelope.report.context).toEqual(props.context);
    expect(Object.isFrozen(envelope.report.geometry.coordinates)).toBe(true);
  });

  it.each(["x".repeat(1000), "\u{1f600}".repeat(1000)])("accepts exactly 1,000 Unicode characters without truncation", value => {
    ready(value);
    expect(prepare.mock.results[0].value.envelope.report.note).toBe(value);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["x".repeat(1001), "\u0000", "\ud800"])("rejects invalid note content without sending", value => {
    render(); choose(); note(value); review();
    expect(text(tree)).toContain("Use up to 1,000 characters without unsupported text characters.");
    expect(text(tree)).toContain("Draft report");
    expect(network).not.toHaveBeenCalled();
  });

  it("bounds programmatic note changes without silently accepting a truncated report", () => {
    render(); choose(); note("Keep this"); note("x".repeat(2001));
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe("Keep this");
    expect(text(tree)).toContain("That edit is too long and was not applied.");
    expect(network).not.toHaveBeenCalled();
  });

  it("preserves whitespace and escapes untrusted note text in the actual markup", () => {
    ready("  <script>synthetic</script>\n  ");
    expect(prepare.mock.results[0].value.envelope.report.note).toBe("  <script>synthetic</script>\n  ");
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("&lt;script&gt;synthetic&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("allows editing before first send only, requiring another review", () => {
    ready("Original"); click("Edit draft"); note("Revised"); choose("shelter_request"); review();
    expect(prepare).toHaveBeenCalledTimes(2); expect(network).not.toHaveBeenCalled();
    expect(prepare.mock.results[1].value.envelope.report).toMatchObject({ report_type: "shelter_request", note: "Revised" });
  });

  it("fails closed when secure envelope generation is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    render(); choose(); review();
    expect(text(tree)).toContain("A secure report could not be prepared. Nothing was sent.");
    expect(text(tree)).not.toContain("Send report"); expect(network).not.toHaveBeenCalled();
  });

  it("signals draft changes and clears the guard only when empty or received", async () => {
    render(); note("One");
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(true);
    note(""); expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
    choose(); review(); expect(props.onUnsavedChange).toHaveBeenLastCalledWith(true);
    network.mockResolvedValueOnce(success()); await send();
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
  });

  it("notifies the parent of draft, pending, uncertainty and receipt phases without exposing report content", async () => {
    const phase = vi.fn(); props.onPhaseChange = phase;
    await uncertain();
    expect(phase.mock.calls).toEqual([["draft"], ["review"], ["sending"], ["uncertain"]]);
    network.mockResolvedValueOnce(success(true)); await click("Retry same report"); render();
    expect(phase.mock.calls.slice(-2)).toEqual([["sending"], ["received"]]);
    click("Done"); expect(phase).toHaveBeenLastCalledWith("closed");
  });

  it("publishes a single pending attempt synchronously and ignores stale edit handlers", async () => {
    const pending = deferred<Response>(); network.mockReturnValueOnce(pending.promise);
    ready();
    const edit = button("Edit draft").props.onClick!;
    const action = button("Send report").props.onClick!;
    const first = action(); const second = action(); edit(); render();
    expect(text(tree)).toContain("Sending report");
    expect(button("Sending").props.disabled).toBe(true);
    expect(elements(tree).some(node => node.type === "textarea" || node.type === "input")).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(true);
    pending.resolve(success()); await first; await second; render();
    expect(network).toHaveBeenCalledTimes(1); expect(text(tree)).toContain("Report received");
  });

  it("only displays the server-confirmed receipt and never request identity or retry proof", async () => {
    network.mockResolvedValueOnce(success()); ready();
    const envelope = prepare.mock.results[0].value.envelope;
    expect(text(tree)).not.toContain(receipt.receipt_id);
    await send();
    expect(text(tree)).toContain(receipt.receipt_id); expect(text(tree)).toContain(receipt.received_at);
    expect(text(tree)).not.toContain(envelope.retrySecret); expect(text(tree)).not.toContain(envelope.report.client_request_id);
    expect(text(tree)).toContain("does not mean the map has been changed or shelter will be built");
    click("Done"); expect(props.onClose).toHaveBeenCalledTimes(1); expect(tree).toBeNull();
  });

  it.each(["disconnect", "invalid receipt", "503 unknown"])("keeps %s as uncertain without edits, fake receipts or automatic retries", async mode => {
    if (mode === "disconnect") network.mockRejectedValueOnce(new Error("Synthetic disconnected"));
    else if (mode === "invalid receipt") network.mockResolvedValueOnce(Response.json({ ok: true, receipt: "fake" }, { status: 201 }));
    else network.mockResolvedValueOnce(failure("outcome_unknown", 503));
    ready(); await send(); render(); render();
    expect(text(tree)).toContain("Save not confirmed");
    expect(text(tree)).toContain("do not submit a new copy");
    expect(text(tree)).not.toContain(receipt.receipt_id);
    expect(elements(tree).some(node => node.type === "textarea" || text(node) === "Edit draft")).toBe(false);
    expect(network).toHaveBeenCalledTimes(1); expect(prepare).toHaveBeenCalledTimes(1);
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(true);
  });

  it("explicitly retries the same envelope, body, identity and proof and recovers the receipt", async () => {
    await uncertain();
    network.mockResolvedValueOnce(success(true));
    await click("Retry same report"); render();
    expect(prepare).toHaveBeenCalledTimes(1); expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[1][0]).toBe(submit.mock.calls[0][0]);
    expect(network.mock.calls[1][1].body).toBe(network.mock.calls[0][1].body);
    expect(network.mock.calls[1][1].headers).toEqual(network.mock.calls[0][1].headers);
    expect(text(tree)).toContain("Report received"); expect(text(tree)).toContain(receipt.receipt_id);
  });

  it("does not erase earlier save uncertainty when an explicit retry is rejected", async () => {
    await uncertain(); network.mockResolvedValueOnce(failure("unavailable", 503));
    await click("Retry same report"); render();
    expect(text(tree)).toContain("Save not confirmed"); expect(text(tree)).not.toContain("Report not accepted");
    click("Close report"); expect(text(tree)).toContain("may already have been saved");
    expect(network).toHaveBeenCalledTimes(2); expect(prepare).toHaveBeenCalledTimes(1);
  });

  it.each([["limited", 429], ["unavailable", 503], ["request_timeout", 408]] as const)("allows only explicit same-envelope retry after %s", async (error, status) => {
    network.mockResolvedValueOnce(failure(error, status)); ready(); await send();
    expect(text(tree)).toContain("Report not accepted");
    render(); expect(network).toHaveBeenCalledTimes(1);
    network.mockResolvedValueOnce(success()); await click("Retry same report"); render();
    expect(submit.mock.calls[1][0]).toBe(submit.mock.calls[0][0]); expect(prepare).toHaveBeenCalledTimes(1);
    expect(text(tree)).toContain("Report received");
  });

  it.each([["expired", 410], ["conflict", 409], ["forbidden", 403]] as const)("does not offer misleading retry or editing after %s", async (error, status) => {
    network.mockResolvedValueOnce(failure(error, status)); ready(); await send();
    expect(text(tree)).toContain("Report not accepted");
    expect(elements(tree).some(node => node.type === "button" && /Retry|Edit/.test(text(node)))).toBe(false);
    expect(network).toHaveBeenCalledTimes(1); expect(props.onUnsavedChange).toHaveBeenLastCalledWith(true);
  });

  it("disables a reviewed send when reporting is turned off, including a stale handler", async () => {
    ready(); const action = button("Send report").props.onClick!;
    props.enabled = false; render(); await action(); render();
    expect(button("Send report").props.disabled).toBe(true);
    expect(submit).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });

  it("disables retry without losing the uncertain envelope, then recovers it after re-enabling", async () => {
    await uncertain(); props.enabled = false; render();
    const retry = button("Retry same report"); expect(retry.props.disabled).toBe(true);
    await retry.props.onClick!(); expect(network).toHaveBeenCalledTimes(1);
    props.enabled = true; render(); network.mockResolvedValueOnce(success(true));
    await click("Retry same report"); render();
    expect(prepare).toHaveBeenCalledTimes(1); expect(text(tree)).toContain("Report received");
  });

  it("accepts a genuine pending receipt even if sending is subsequently disabled", async () => {
    const pending = deferred<Response>(); network.mockReturnValueOnce(pending.promise);
    ready(); const task = click("Send report"); props.enabled = false; render();
    pending.resolve(success()); await task; render();
    expect(text(tree)).toContain("Report received"); expect(text(tree)).toContain(receipt.receipt_id);
  });

  it("freezes caller-owned geometry and context even when the parent mutates the same objects", async () => {
    render();
    (props.geometry!.coordinates as number[])[0] = 103.86;
    (props.context as { postal_code: string }).postal_code = "002002";
    props.bundleVersion = "synthetic-bundle-v2";
    render(); choose(); review();
    expect(text(tree)).toContain("Map selection changed.");
    network.mockResolvedValueOnce(success()); await send();
    const body = JSON.parse(network.mock.calls[0][1].body);
    expect(body.geometry).toEqual(point);
    expect(body.context.postal_code).toBe("001001"); expect(body.referenced_bundle_version).toBe("synthetic-bundle-v1");
    expect(text(tree)).toContain("Postal 001001"); expect(text(tree)).not.toContain("Postal 002002");
  });

  it.each(["review", "sending", "uncertain", "received"])("a selection change during %s cannot retarget or misattribute the old receipt", async phase => {
    ready();
    let task: void | Promise<void> = undefined;
    const pending = deferred<Response>();
    if (phase === "sending") { network.mockReturnValueOnce(pending.promise); task = click("Send report"); }
    if (phase === "uncertain") { network.mockRejectedValueOnce(new Error("offline")); await send(); }
    if (phase === "received") { network.mockResolvedValueOnce(success()); await send(); }
    props = { ...props, geometry: { type: "Point", coordinates: [103.86, 1.36] }, context: { postal_code: "002002", transit_category: "mrt_lrt" }, bundleVersion: "synthetic-bundle-v2" };
    render();
    expect(text(tree)).toContain("Map selection changed. This report still refers to the original location below.");
    expect(text(tree)).toContain("Postal 001001"); expect(text(tree)).not.toContain("Postal 002002");
    if (phase === "sending") { pending.resolve(success()); await task; render(); }
    if (phase === "uncertain") { network.mockResolvedValueOnce(success(true)); await click("Retry same report"); render(); }
    if (phase === "review") { network.mockResolvedValueOnce(success()); await send(); }
    expect(text(tree)).toContain(receipt.receipt_id); expect(text(tree)).toContain("Postal 001001");
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it("equivalent cloned selection does not produce a false changed-location notice", () => {
    ready(); props.geometry = structuredClone(props.geometry); props.context = structuredClone(props.context); render();
    expect(text(tree)).not.toContain("Map selection changed"); expect(prepare).toHaveBeenCalledTimes(1);
  });

  it("an invalid initial location cannot silently become valid after the selection changes", () => {
    props.geometry = null; render(); choose(); props.geometry = point; render(); review();
    expect(button("Review report").props.disabled).toBe(true);
    expect(text(tree)).toContain("Map selection changed"); expect(prepare).not.toHaveBeenCalled();
  });

  it("closes an untouched draft immediately, exactly once, without sending", () => {
    render(); const close = button("Close report").props.onClick!;
    close(); close(); render();
    expect(props.onClose).toHaveBeenCalledTimes(1); expect(tree).toBeNull();
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false); expect(network).not.toHaveBeenCalled();
  });

  it("asks before discarding a changed draft and can retain it intact", () => {
    render(); note("Unsent note"); click("Close report");
    expect(text(tree)).toContain("Discard this draft? It has not been sent.");
    expect(props.onClose).not.toHaveBeenCalled(); click("Keep report open");
    expect(elements(tree).find(node => node.type === "textarea")?.props.value).toBe("Unsent note");
    click("Close report"); click("Discard draft");
    expect(props.onClose).toHaveBeenCalledTimes(1); expect(tree).toBeNull(); expect(network).not.toHaveBeenCalled();
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
  });

  it("reviewed but unsent drafts use the unsent warning, not a saved-report claim", () => {
    ready(); click("Close report");
    expect(text(tree)).toContain("It has not been sent."); expect(text(tree)).not.toContain("may already have been saved");
    click("Keep report open"); expect(text(tree)).toContain("Review report"); expect(network).not.toHaveBeenCalled();
  });

  it("clears the parent guard before an onClose callback synchronously unmounts the form", () => {
    const events: string[] = [];
    props.onUnsavedChange = vi.fn(value => { events.push(`unsaved:${value}`); });
    props.onClose = vi.fn(() => { events.push("close"); host.unmount(); });
    ready(); click("Close report");
    events.length = 0;
    button("Discard draft").props.onClick!();
    expect(events).toEqual(["unsaved:false", "close"]);
    expect(network).not.toHaveBeenCalled();
  });

  it("unknown-save dismissal explicitly warns about lost recovery and never pretends to delete", async () => {
    await uncertain(); click("Close report");
    for (const message of ["may already have been saved", "Closing does not cancel or delete it", "lose the ability to retry this report or recover its receipt", "Do not create another report for the same issue"]) {
      expect(text(tree)).toContain(message);
    }
    expect(props.onClose).not.toHaveBeenCalled(); click("Keep report open");
    expect(button("Retry same report")).toBeDefined();
    click("Close report"); click("Close without receipt");
    expect(props.onClose).toHaveBeenCalledTimes(1); expect(tree).toBeNull(); expect(network).toHaveBeenCalledTimes(1);
  });

  it("closing while sending warns before forgetting and ignores a late response without cancellation claims", async () => {
    const pending = deferred<Response>(); network.mockReturnValueOnce(pending.promise);
    ready(); const task = click("Send report"); click("Close report");
    expect(text(tree)).toContain("may already have been saved"); click("Close without receipt");
    pending.resolve(success()); await task; render();
    expect(tree).toBeNull(); expect(props.onClose).toHaveBeenCalledTimes(1); expect(network).toHaveBeenCalledTimes(1);
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
  });

  it("a pending success replaces the close warning with the genuine receipt if the user has not left", async () => {
    const pending = deferred<Response>(); network.mockReturnValueOnce(pending.promise);
    ready(); const task = click("Send report"); click("Close report");
    const staleDiscard = button("Close without receipt").props.onClick!;
    pending.resolve(success()); await task; render(); staleDiscard(); render();
    expect(text(tree)).toContain("Report received"); expect(text(tree)).toContain(receipt.receipt_id);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("unmount invalidates a pending response without notifying a new composition of success", async () => {
    const pending = deferred<Response>(); network.mockReturnValueOnce(pending.promise);
    ready(); const task = click("Send report");
    const oldUnsaved = props.onUnsavedChange;
    const oldClose = props.onClose;
    const callbacks = vi.mocked(oldUnsaved).mock.calls.length;
    host.unmount(); props = { ...props, context: { postal_code: "002002" }, onClose: vi.fn(), onUnsavedChange: vi.fn() }; render();
    pending.resolve(success()); await task; render();
    expect(text(tree)).toContain("Draft report"); expect(text(tree)).toContain("Postal 002002");
    expect(text(tree)).not.toContain(receipt.receipt_id);
    expect(oldUnsaved).toHaveBeenCalledTimes(callbacks); expect(oldClose).not.toHaveBeenCalled();
    expect(props.onUnsavedChange).toHaveBeenLastCalledWith(false);
  });

  it("renders semantic labels, radio grouping, live status and phase focus targets", () => {
    render();
    const textarea = elements(tree).find(node => node.type === "textarea")!;
    expect(elements(tree).some(node => node.type === "label" && node.props.htmlFor === textarea.props.id)).toBe(true);
    expect(textarea.props["aria-describedby"]).toContain("-privacy");
    expect(textarea.props.maxLength).toBe(2000);
    expect(elements(tree).some(node => node.type === "fieldset")).toBe(true);
    expect(focus).not.toHaveBeenCalled(); choose(); review();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(elements(tree).find(node => node.type === "h2")?.props.tabIndex).toBe(-1);
    expect(elements(tree).some(node => node.props.role === "status" && text(node).includes("Not sent yet"))).toBe(true);
    click("Close report"); expect(focus).toHaveBeenCalledTimes(2);
    click("Keep report open"); expect(focus).toHaveBeenCalledTimes(3);
  });
});
